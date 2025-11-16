// In-memory storage for users
export const users = new Map();

// Helper functions
export const findUserByEmail = (email) => {
    for (const [id, user] of users) {
        if (user.email === email) {
            return user;
        }
    }
    return null;
};

export const findUserById = (id) => {
    return users.get(id) || null;
};

export const findUserByFarmerId = (farmerId) => {
    for (const [id, user] of users) {
        if (user.farmerId === farmerId) {
            return user;
        }
    }
    return null;
};

export const createUser = (userData) => {
    const id = Date.now().toString();
    const user = {
        id,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    users.set(id, user);
    return user;
};

export const updateUser = (id, updates) => {
    const user = users.get(id);
    if (!user) return null;
    
    const updatedUser = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
    };
    users.set(id, updatedUser);
    return updatedUser;
};

export const deleteUser = (id) => {
    return users.delete(id);
};