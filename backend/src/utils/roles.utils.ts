/**
 * Get role ID by role name
 */
export function getRoleId(roleName: string): number {
  const roleMap = {
    client: 1,
    courier: 2,
    admin: 3,
    business: 4,
  };

  const roleId = roleMap[roleName.toLowerCase() as keyof typeof roleMap];

  if (!roleId) {
    throw new Error("Invalid role name");
  }

  return roleId;
}

/**
 * Get user role name by role ID
 */
export function getUserRoleName(roleId: number): string {
  const roleMap = {
    1: "client",
    2: "courier",
    3: "admin",
    4: "business",
  };
  return roleMap[roleId as keyof typeof roleMap] || "client";
}
