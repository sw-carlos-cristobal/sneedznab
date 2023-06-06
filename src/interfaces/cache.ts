export interface ICache {
  name: string;
  connect?(): Promise<void>;
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
}
