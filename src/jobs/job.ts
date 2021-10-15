export interface Job {
    name: string;
    log: boolean;
    schedule: string;
    run(client?): Promise<void>;
}
