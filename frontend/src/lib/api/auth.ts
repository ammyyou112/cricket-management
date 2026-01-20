import { apiClient } from '../apiClient';
import { User } from '@/types/api.types';
import { RegisterData, LoginCredentials } from '@/types/auth.types';
import { TokenUtils } from '@/utils/token.utils';
import { getMockUserByRole, mockUsers, delay } from '../mockData';

// MOCK MODE: Set to false to use real backend
const MOCK_MODE = false;

/**
 * Sign up a new user and create their profile in the database.
 * @param data Registration data including email, password, name, role, etc.
 * @returns The created user profile with role or throws an error.
 */
// Logging removed for production

export const signUp = async (data: RegisterData & { playerType?: string }) => {
  if (MOCK_MODE) {
    await delay(500);
    const mockUser = getMockUserByRole(data.role);
    return { ...mockUser, role: data.role, playerType: data.playerType };
  }

  // Transform frontend format to backend format
  const backendData = {
    email: data.email,
    password: data.password, // Never log passwords
    fullName: data.full_name,
    phone: data.phone,
    role: data.role.toUpperCase() as 'PLAYER' | 'CAPTAIN' | 'ADMIN',
    playerType: data.playerType?.toUpperCase().replace('-', '_'),
  };

  const { data: response, error } = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', backendData);
  
  if (error) {
    // Create error with detailed message that can be extracted by Register component
    const errorObj = new Error(error);
    // Set multiple error properties for compatibility with different error handling patterns
    (errorObj as any).message = error;
    (errorObj as any).response = { 
      data: { 
        message: error,
        error: error 
      } 
    };
    throw errorObj;
  }
  
  if (!response || !response.user) {
    throw new Error('User creation failed');
  }

  // Store tokens
  if (response.accessToken) {
    TokenUtils.setAccessToken(response.accessToken);
  }
  if (response.refreshToken) {
    TokenUtils.setRefreshToken(response.refreshToken);
  }

  return response.user;
};

/**
 * Sign in an existing user and fetch their complete profile.
 * @param credentials Email and password
 * @returns User profile data including role.
 */
export const signIn = async ({ email, password }: LoginCredentials) => {
  if (MOCK_MODE) {
    await delay(500);
    // Return mock user based on email or default to player
    let mockUser = mockUsers.find(u => u.email === email);
    if (!mockUser) {
      // Auto-select user based on email pattern
      if (email.includes('captain')) {
        mockUser = getMockUserByRole('captain');
      } else if (email.includes('admin')) {
        mockUser = getMockUserByRole('admin');
      } else {
        mockUser = getMockUserByRole('player');
      }
    }
    return mockUser;
  }

  const { data: response, error } = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
    email,
    password, // Never log passwords
  });

  if (error) {
    // Create error with detailed message that can be extracted by Login component
    const errorObj = new Error(error);
    // Ensure message is set correctly
    errorObj.message = error;
    // Set response object for compatibility
    (errorObj as any).response = { 
      data: { 
        message: error,
        error: error 
      } 
    };
    throw errorObj;
  }

  if (!response || !response.user) {
    throw new Error('Authentication failed');
  }

  // Store tokens
  if (response.accessToken) {
    TokenUtils.setAccessToken(response.accessToken);
  }
  if (response.refreshToken) {
    TokenUtils.setRefreshToken(response.refreshToken);
  }

  return response.user;
};

/**
 * Sign out the current user.
 */
export const signOut = async () => {
  if (MOCK_MODE) {
    await delay(200);
    TokenUtils.clearAuth();
    return true;
  }

  // Get refresh token before clearing
  const refreshToken = TokenUtils.getRefreshToken();
  
  // Send logout request to backend with refresh token
  if (refreshToken) {
    try {
      const { error } = await apiClient.post('/auth/logout', {
        refreshToken,
      });
    } catch (err) {
      // Continue with local cleanup even if API call fails
    }
  }
  
  // Clear all auth data regardless of API response
  TokenUtils.clearAuth();
  
  return true;
};

/**
 * Get the currently authenticated user with their full profile.
 * @returns User profile or null if not authenticated.
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (MOCK_MODE) {
    await delay(300);
    return getMockUserByRole('player');
  }

  const { data: user, error } = await apiClient.get<User>('/auth/me');

  if (error) {
    return null;
  }

  return user;
};

/**
 * Upload a profile picture to backend storage.
 * @param userId User ID (not used in new endpoint, but kept for compatibility)
 * @param file File object to upload
 * @returns Public URL of the uploaded image
 */
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  if (MOCK_MODE) {
    await delay(1000);
    return `https://via.placeholder.com/150?text=${encodeURIComponent(file.name)}`;
  }

  const { data: response, error } = await apiClient.uploadFile<{ url: string }>(
    `/upload/profile`,
    file
  );

  if (error) {
    throw new Error(error);
  }

  if (!response || !response.url) {
    throw new Error('Upload failed');
  }

  return response.url;
};

/**
 * Update user profile data.
 * @param userId User ID
 * @param data Partial user data to update (can be frontend format with full_name or backend format with fullName)
 * @returns Updated user profile
 */
export const updateProfile = async (userId: string, data: any) => {
  if (MOCK_MODE) {
    await delay(500);
    const mockUser = mockUsers.find(u => u.id === userId) || mockUsers[0];
    return { ...mockUser, ...data };
  }

  // Transform frontend format (full_name) to backend format (fullName)
  const backendData: any = {};
  
  // Handle name field (frontend uses full_name, backend uses fullName)
  if (data.full_name !== undefined) {
    backendData.fullName = data.full_name;
  } else if (data.fullName !== undefined) {
    backendData.fullName = data.fullName;
  }
  
  // Handle role (frontend uses lowercase, backend uses uppercase)
  if (data.role) {
    backendData.role = typeof data.role === 'string' && data.role === data.role.toLowerCase() 
      ? data.role.toUpperCase() 
      : data.role;
  }
  
  // Handle player type (frontend uses kebab-case, backend uses UPPER_SNAKE_CASE)
  if (data.player_type !== undefined) {
    backendData.playerType = data.player_type.toUpperCase().replace('-', '_');
  } else if (data.playerType !== undefined) {
    backendData.playerType = typeof data.playerType === 'string' && data.playerType.includes('-')
      ? data.playerType.toUpperCase().replace('-', '_')
      : data.playerType;
  }
  
  // Copy other fields as-is
  if (data.phone !== undefined) backendData.phone = data.phone;
  if (data.city !== undefined) backendData.city = data.city;
  if (data.profilePictureUrl !== undefined) backendData.profilePictureUrl = data.profilePictureUrl;
  if (data.profile_picture !== undefined) backendData.profilePictureUrl = data.profile_picture;
  // ✅ Location fields
  if (data.locationLatitude !== undefined) backendData.locationLatitude = data.locationLatitude;
  if (data.locationLongitude !== undefined) backendData.locationLongitude = data.locationLongitude;

  const { data: updatedUser, error } = await apiClient.patch<User>(`/users/${userId}`, backendData);

  if (error) {
    throw new Error(error);
  }

  if (!updatedUser) {
    throw new Error('Update failed');
  }

  return updatedUser;
};

/**
 * Upload team logo
 * @param teamId Team ID
 * @param file File object to upload
 * @returns Public URL of the uploaded image
 */
export const uploadTeamLogo = async (teamId: string, file: File): Promise<string> => {
  if (MOCK_MODE) {
    await delay(1000);
    return `https://via.placeholder.com/150?text=${encodeURIComponent(file.name)}`;
  }

  const { data: response, error } = await apiClient.uploadFile<{ url: string }>(
    `/upload/team/${teamId}`,
    file
  );

  if (error) {
    throw new Error(error);
  }

  if (!response || !response.url) {
    throw new Error('Upload failed');
  }

  return response.url;
};

/**
 * Delete team logo
 * @param teamId Team ID
 */
export const deleteTeamLogo = async (teamId: string): Promise<void> => {
  if (MOCK_MODE) {
    await delay(500);
    return;
  }

  const { error } = await apiClient.delete(`/upload/team/${teamId}`);

  if (error) {
    throw new Error(error);
  }
};

/**
 * Change user password
 * @param currentPassword Current password
 * @param newPassword New password
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  if (MOCK_MODE) {
    await delay(500);
    return;
  }

  const { error } = await apiClient.put('/users/password', {
    currentPassword,
    newPassword,
  });

  if (error) {
    throw new Error(error);
  }
};

/**
 * Request password reset
 * @param email User email address
 * @returns Response with message and optional token (dev mode)
 */
export const forgotPassword = async (email: string): Promise<{ message: string; token?: string }> => {
  if (MOCK_MODE) {
    await delay(500);
    return { message: 'Password reset email sent (mock mode)' };
  }

  const { data, error } = await apiClient.post<{ message: string; token?: string }>('/auth/forgot-password', {
    email,
  });

  if (error) {
    throw new Error(error);
  }

  if (!data) {
    throw new Error('Failed to request password reset');
  }

  return data;
};

/**
 * Reset password with token
 * @param token Reset token
 * @param newPassword New password
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  if (MOCK_MODE) {
    await delay(500);
    return;
  }

  const { error } = await apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  });

  if (error) {
    throw new Error(error);
  }
};
