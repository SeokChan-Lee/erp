export type AuthUser = {
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
};

export type LoginPayload = {
  username: string;
  password: string;
};
