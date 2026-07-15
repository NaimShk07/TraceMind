import type { RepositoryDetails } from '@tracemind/shared';

export class RepositoryStore {
  private repositories: Map<string, RepositoryDetails> = new Map();
  private activeRepositoryId: string | null = null;

  public addRepository(repo: RepositoryDetails): void {
    this.repositories.set(repo.repositoryId, repo);
    this.activeRepositoryId = repo.repositoryId;
  }

  public getRepository(id: string): RepositoryDetails | undefined {
    return this.repositories.get(id);
  }

  public getActiveRepository(): RepositoryDetails | undefined {
    if (!this.activeRepositoryId) return undefined;
    return this.repositories.get(this.activeRepositoryId);
  }

  public getActiveRepositoryId(): string | null {
    return this.activeRepositoryId;
  }

  public getAllRepositories(): RepositoryDetails[] {
    return Array.from(this.repositories.values());
  }

  public clear(): void {
    this.repositories.clear();
    this.activeRepositoryId = null;
  }
}

export const repositoryStore = new RepositoryStore();
export default repositoryStore;
