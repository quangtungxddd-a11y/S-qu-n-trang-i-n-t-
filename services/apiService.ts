
import { Soldier, EquipmentItem } from '../types';
import { MOCK_EQUIPMENT } from './mockData';

interface SyncTask {
  id: string;
  type: 'UPDATE_SOLDIER' | 'UPDATE_INVENTORY' | 'SAVE_ISSUES';
  data: any;
  timestamp: number;
}

class ApiService {
  private isSyncing = false;
  private socket: WebSocket | null = null;
  private onDataChangeCallback: (() => void) | null = null;
  
  private get baseUrl(): string {
    const savedIp = localStorage.getItem('lan_server_ip');
    return savedIp ? `http://${savedIp}:3000/api` : '';
  }

  private get wsUrl(): string {
    const savedIp = localStorage.getItem('lan_server_ip');
    return savedIp ? `ws://${savedIp}:3000` : '';
  }

  // --- QUẢN LÝ WEBSOCKET ---
  public connectWebSocket() {
    if (!this.wsUrl || (this.socket && this.socket.readyState === WebSocket.OPEN)) return;

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log("LAN Sync: Luồng trực tiếp đã thông suốt.");
        this.processQueue();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'DATA_CHANGED' && this.onDataChangeCallback) {
            this.onDataChangeCallback();
          }
        } catch (e) {}
      };

      this.socket.onclose = () => {
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch (e) {}
  }

  public onDataChange(callback: () => void) {
    this.onDataChangeCallback = callback;
  }

  // --- QUẢN LÝ GỬI TIN ---
  private getQueue(): SyncTask[] {
    const data = localStorage.getItem('sync_queue');
    return data ? JSON.parse(data) : [];
  }

  private saveQueue(queue: SyncTask[]): void {
    localStorage.setItem('sync_queue', JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('sync_queue_updated', { detail: { count: queue.length } }));
  }

  private addToQueue(type: SyncTask['type'], data: any) {
    const queue = this.getQueue();
    queue.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: Date.now()
    });
    this.saveQueue(queue);
    this.processQueue();
  }

  async processQueue() {
    if (this.isSyncing || !this.baseUrl) return;
    
    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.isSyncing = true;
    const remainingTasks: SyncTask[] = [...queue];

    try {
      for (const task of queue) {
        try {
          const response = await fetch(`${this.baseUrl}/${this.getEndpoint(task.type)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task.data)
          });
          if (response.ok) {
            const index = remainingTasks.findIndex(t => t.id === task.id);
            if (index > -1) remainingTasks.splice(index, 1);
          } else {
            break;
          }
        } catch (e) {
          break;
        }
      }
    } finally {
      this.saveQueue(remainingTasks);
      this.isSyncing = false;
    }
  }

  private getEndpoint(type: SyncTask['type']): string {
    switch (type) {
      case 'UPDATE_SOLDIER': return 'soldiers';
      case 'UPDATE_INVENTORY': return 'inventory';
      case 'SAVE_ISSUES': return 'issues';
      default: return '';
    }
  }

  async checkConnection(): Promise<boolean> {
    if (!this.baseUrl) return false;
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  // --- TRUY XUẤT DỮ LIỆU ---

  async getInventory(): Promise<EquipmentItem[]> {
    // 1. Thử lấy từ Server LAN
    if (this.baseUrl) {
      try {
        const response = await fetch(`${this.baseUrl}/inventory`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            localStorage.setItem('local_inventory_cache', JSON.stringify(data));
            return data;
          }
        }
      } catch (e) {}
    }

    // 2. Thử lấy từ Cache LocalStorage
    const cache = localStorage.getItem('local_inventory_cache');
    if (cache) {
      const parsed = JSON.parse(cache);
      if (parsed.length > 0) return parsed;
    }

    // 3. Khởi tạo từ MOCK_EQUIPMENT nếu trắng dữ liệu
    localStorage.setItem('local_inventory_cache', JSON.stringify(MOCK_EQUIPMENT));
    return MOCK_EQUIPMENT;
  }

  async updateInventory(data: EquipmentItem[]): Promise<void> {
    localStorage.setItem('local_inventory_cache', JSON.stringify(data));
    this.addToQueue('UPDATE_INVENTORY', data);
  }

  async getSoldiers(): Promise<Soldier[]> {
    if (this.baseUrl) {
      try {
        const response = await fetch(`${this.baseUrl}/soldiers`);
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('local_soldiers_cache', JSON.stringify(data));
          return data;
        }
      } catch (e) { }
    }
    const cache = localStorage.getItem('local_soldiers_cache');
    return cache ? JSON.parse(cache) : [];
  }

  async updateSoldier(soldier: Soldier): Promise<void> {
    const all = await this.getSoldiers();
    const idx = all.findIndex(s => s.serviceId === soldier.serviceId);
    const updated = idx !== -1 
      ? all.map(s => s.serviceId === soldier.serviceId ? soldier : s) 
      : [...all, soldier];
    
    localStorage.setItem('local_soldiers_cache', JSON.stringify(updated));
    this.addToQueue('UPDATE_SOLDIER', updated);
  }

  async getIssues(): Promise<any[]> {
    if (this.baseUrl) {
      try {
        const response = await fetch(`${this.baseUrl}/issues`);
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('local_issues_cache', JSON.stringify(data));
          return data;
        }
      } catch (e) { }
    }
    const cache = localStorage.getItem('local_issues_cache');
    return cache ? JSON.parse(cache) : [];
  }

  async saveIssues(issues: any[]): Promise<void> {
    localStorage.setItem('local_issues_cache', JSON.stringify(issues));
    this.addToQueue('SAVE_ISSUES', issues);
  }
}

export const api = new ApiService();
