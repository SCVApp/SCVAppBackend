export class LockerWithActiveUser {
  id: number;
  identifier: string;
  current_user: {
    azure_id: string;
    start_time: Date;
    end_time: Date;
  } | null;
}
