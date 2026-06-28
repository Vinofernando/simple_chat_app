export type FriendRequestStatus =
  | "accept"
  | "delete"
  | "block"
  | "unblock"
  | "cancel";

export interface FriendListQuery {
  searchByName: string;
}
