module.exports = {
    checkAdminPermissions: (member, allowedRoleIds) => {
      return member.roles.cache.some(role => allowedRoleIds.includes(role.id));
    }
  };
  