/**
 * Firestore Manager
 * Handles data persistence for design snapshots and public gallery
 */

import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface ShowcaseItem {
  id?: string;
  userId: string;
  appId: string;
  title: string;
  name?: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  thumbnail: string;
  metadata: {
    roomType: string;
    style: string;
    transformationType: string;
    coordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    processingTime?: number;
    cost?: number;
    materials?: string[];
    colors?: string[];
  };
  author: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  isPublic: boolean;
  featured?: boolean;
  tags: string[];
  likes: number;
  views: number;
  createdAt: Timestamp | Date | any;
  updatedAt?: Timestamp | Date | any;
}

export default class FirestoreManager {
  private db: Firestore;
  private appId: string;

  constructor(db: Firestore, appId: string) {
    this.db = db;
    this.appId = appId;
  }

  /**
   * Save a design snapshot to Firestore (Private and optionally Public)
   */
  async saveDesignSnapshot(data: Partial<ShowcaseItem>): Promise<string> {
    if (!data.userId) throw new Error("userId is required to save a snapshot");

    // 1. Private Data Storage (Mandatory Rules: /artifacts/{appId}/users/{userId}/designs)
    const privateRef = collection(this.db, "artifacts", this.appId, "users", data.userId, "designs");
    const snapshotData = {
      ...data,
      appId: this.appId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(privateRef, snapshotData);

    // 2. Public Gallery (Mandatory Rules: /artifacts/{appId}/public/data/showcase)
    if (data.isPublic) {
      const publicRef = collection(this.db, "artifacts", this.appId, "public", "data", "showcase");
      await addDoc(publicRef, {
        ...snapshotData,
        originalId: docRef.id // Keep a reference to the private doc
      });
    }

    return docRef.id;
  }

  /**
   * Get public gallery items (Simple collection call, no where/orderBy)
   */
  async getPublicGallery(maxItems: number = 50): Promise<ShowcaseItem[]> {
    const publicRef = collection(this.db, "artifacts", this.appId, "public", "data", "showcase");

    // Using a simple query avoiding complex indices
    const q = query(publicRef, firestoreLimit(maxItems));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ShowcaseItem[];
  }

  /**
   * Get a single design by ID (Public Showcase lookup)
   */
  async getDesign(designId: string): Promise<ShowcaseItem | null> {
    const docRef = doc(this.db, "artifacts", this.appId, "public", "data", "showcase", designId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as ShowcaseItem;
  }

  /**
   * Increment the view count for a design
   */
  async incrementViews(designId: string): Promise<void> {
    const docRef = doc(this.db, "artifacts", this.appId, "public", "data", "showcase", designId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const currentViews = snapshot.data().views || 0;
      await updateDoc(docRef, { views: currentViews + 1 });
    }
  }

  /**
   * Toggle like on a design
   */
  async toggleLike(designId: string): Promise<number> {
    const docRef = doc(this.db, "artifacts", this.appId, "public", "data", "showcase", designId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const currentLikes = snapshot.data().likes || 0;
      const newLikes = currentLikes + 1;
      await updateDoc(docRef, { likes: newLikes });
      return newLikes;
    }
    return 0;
  }

  /**
   * Get designs by user
   */
  async getUserDesigns(userId: string): Promise<ShowcaseItem[]> {
    const userRef = collection(this.db, "artifacts", this.appId, "users", userId, "designs");

    // Simple query approach (no where or orderBy to avoid index issues)
    const snapshot = await getDocs(userRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ShowcaseItem[];
  }
}
