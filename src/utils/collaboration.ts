import { Collaborator, DocumentComment, TrackedChange } from '../types/document';
export type { TrackedChange };

export const INITIAL_COLLABORATORS: Collaborator[] = [];

export const INITIAL_COMMENTS: DocumentComment[] = [];

export class CollaborationSyncChannel {
  private channel: BroadcastChannel | null = null;
  private onMessageCallback?: (data: any) => void;

  constructor(channelName: string = 'word_studio_collab_room_v1') {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = (event) => {
          if (this.onMessageCallback) {
            this.onMessageCallback(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available', e);
      }
    }
  }

  public subscribe(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  public broadcast(type: string, payload: any) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload, sender: 'current-session', timestamp: Date.now() });
      } catch (e) {
        console.warn('Broadcast failed', e);
      }
    }
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
