export type AppUserRole = "admin" | "seller";

export type AppUser = {
  userId: string;
  password: string;
  name: string;
  role: AppUserRole;
};

export const mockUsers: AppUser[] = [
  {
    userId: "admin001",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
  {
    userId: "seller001",
    password: "seller001",
    name: "Kyaw Zin",
    role: "seller",
  },
  {
    userId: "seller002",
    password: "seller002",
    name: "Moe Thu",
    role: "seller",
  },
];
