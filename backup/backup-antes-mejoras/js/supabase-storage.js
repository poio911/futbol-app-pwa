/**
 * Supabase Storage Module - Image Upload and Management
 * Handles player photos and person avatars with Supabase Storage
 */

class SupabaseStorageManager {
    constructor() {
        // Supabase configuration
        // Supabase configuration - UPDATED WITH CORRECT CREDENTIALS
        this.supabaseUrl = 'https://fuwjuyblpfpnfhobtjnr.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1d2p1eWJscGZwbmZob2J0am5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MTE5MDMsImV4cCI6MjA3MjA4NzkwM30.w9olRlZrOp2aWtQn93DKhLgWhpTPrec9FiTgjaOaBt4';
        
        this.buckets = {
            playerPhotos: 'player-photos',
            userAvatars: 'user-avatars'
        };
        
        // Initialize Supabase client when available
        this.client = null;
        this.isReady = false;
        this.initSupabase();
    }

    /**
     * Initialize Supabase client
     */
    async initSupabase() {
        try {
            if (typeof supabase !== 'undefined') {
                this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
                this.isReady = true;
                console.log('✅ Supabase Storage initialized successfully');
                
                // Skip automatic bucket creation - must be done manually in Supabase Dashboard
                // await this.ensureBucketsExist();
                console.log('📦 Please ensure buckets exist in Supabase Dashboard: player-photos, user-avatars');
            } else {
                console.warn('⚠️ Supabase library not loaded, will fallback to base64');
            }
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
            this.isReady = false;
        }
    }

    /**
     * Ensure required buckets exist
     */
    async ensureBucketsExist() {
        try {
            const { data: buckets, error } = await this.client.storage.listBuckets();
            
            if (error) {
                console.warn('Could not check existing buckets:', error);
                return;
            }

            const existingBuckets = buckets.map(b => b.name);
            
            for (const [key, bucketName] of Object.entries(this.buckets)) {
                if (!existingBuckets.includes(bucketName)) {
                    console.log(`Creating bucket: ${bucketName}`);
                    await this.createBucket(bucketName);
                }
            }
        } catch (error) {
            console.warn('Error ensuring buckets exist:', error);
        }
    }

    /**
     * Create a new storage bucket
     */
    async createBucket(bucketName) {
        try {
            const { data, error } = await this.client.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
                fileSizeLimit: 10485760 // 10MB
            });

            if (error && !error.message.includes('already exists')) {
                console.error(`Error creating bucket ${bucketName}:`, error);
                return false;
            }

            console.log(`✅ Bucket ${bucketName} ready`);
            return true;
        } catch (error) {
            console.error(`Error creating bucket ${bucketName}:`, error);
            return false;
        }
    }

    /**
     * Upload player photo to Supabase Storage
     * @param {string} playerId - Player ID
     * @param {File} file - Image file
     * @returns {Promise<string>} Public URL or base64 fallback
     */
    async uploadPlayerPhoto(playerId, file) {
        if (!this.isReady || !this.client) {
            console.log('📦 Supabase not ready, using base64 fallback');
            return await Utils.fileToBase64(file);
        }

        try {
            // Validate file
            if (!Utils.isValidImageFile(file)) {
                throw new Error('Invalid image file');
            }

            // Generate unique file path
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `players/${playerId}/${fileName}`;

            console.log(`📤 Uploading player photo: ${filePath}`);

            // Upload to Supabase Storage with public access
            const { data, error } = await this.client.storage
                .from(this.buckets.playerPhotos)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true  // Changed to true to allow overwrite
                });

            if (error) {
                console.error('Upload error:', error);
                throw error;
            }

            // Get public URL
            const { data: urlData } = this.client.storage
                .from(this.buckets.playerPhotos)
                .getPublicUrl(data.path);

            console.log('✅ Player photo uploaded:', urlData.publicUrl);
            return urlData.publicUrl;

        } catch (error) {
            console.error('❌ Error uploading player photo, using base64 fallback:', error);
            return await Utils.fileToBase64(file);
        }
    }

    /**
     * Upload person avatar to Supabase Storage
     * @param {string} personId - Person ID  
     * @param {File} file - Image file
     * @returns {Promise<string>} Public URL or base64 fallback
     */
    async uploadPersonAvatar(personId, file) {
        if (!this.isReady || !this.client) {
            console.log('📦 Supabase not ready, using base64 fallback');
            return await Utils.fileToBase64(file);
        }

        try {
            // Validate file
            if (!Utils.isValidImageFile(file)) {
                throw new Error('Invalid image file');
            }

            // Generate unique file path
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `avatars/${personId}/${fileName}`;

            console.log(`📤 Uploading person avatar: ${filePath}`);

            // Upload to Supabase Storage with public access
            const { data, error } = await this.client.storage
                .from(this.buckets.userAvatars)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true  // Changed to true to allow overwrite
                });

            if (error) {
                console.error('Upload error:', error);
                throw error;
            }

            // Get public URL
            const { data: urlData } = this.client.storage
                .from(this.buckets.userAvatars)
                .getPublicUrl(data.path);

            console.log('✅ Person avatar uploaded:', urlData.publicUrl);
            return urlData.publicUrl;

        } catch (error) {
            console.error('❌ Error uploading person avatar, using base64 fallback:', error);
            return await Utils.fileToBase64(file);
        }
    }

    /**
     * Delete image from Supabase Storage
     * @param {string} url - Image URL to delete
     * @param {string} type - 'player' or 'person'
     * @returns {Promise<boolean>} Success status
     */
    async deleteImage(url, type = 'player') {
        if (!this.isReady || !this.client || !url.includes('supabase')) {
            console.log('📦 Cannot delete - not a Supabase image or client not ready');
            return false;
        }

        try {
            // Extract file path from URL
            const urlParts = url.split('/');
            const bucketName = type === 'player' ? this.buckets.playerPhotos : this.buckets.userAvatars;
            
            // Find the file path (everything after the bucket name in URL)
            const bucketIndex = urlParts.findIndex(part => part === bucketName);
            if (bucketIndex === -1) {
                console.error('Could not extract file path from URL');
                return false;
            }
            
            const filePath = urlParts.slice(bucketIndex + 1).join('/');
            
            console.log(`🗑️ Deleting image: ${filePath} from bucket: ${bucketName}`);

            const { error } = await this.client.storage
                .from(bucketName)
                .remove([filePath]);

            if (error) {
                console.error('Delete error:', error);
                return false;
            }

            console.log('✅ Image deleted successfully');
            return true;

        } catch (error) {
            console.error('❌ Error deleting image:', error);
            return false;
        }
    }

    /**
     * Get optimized image URL with transformations
     * @param {string} url - Original image URL
     * @param {Object} options - Transformation options
     * @returns {string} Optimized URL
     */
    getOptimizedUrl(url, options = {}) {
        if (!url || !url.includes('supabase')) {
            return url; // Return original if not Supabase URL
        }

        const {
            width = null,
            height = null,
            resize = 'cover',
            quality = 80
        } = options;

        let transformedUrl = url;

        // Add transformation parameters
        const params = [];
        if (width) params.push(`width=${width}`);
        if (height) params.push(`height=${height}`);
        if (resize && (width || height)) params.push(`resize=${resize}`);
        params.push(`quality=${quality}`);

        if (params.length > 0) {
            const separator = url.includes('?') ? '&' : '?';
            transformedUrl = `${url}${separator}${params.join('&')}`;
        }

        return transformedUrl;
    }

    /**
     * Check if URL is a Supabase image
     * @param {string} url - URL to check
     * @returns {boolean} True if Supabase URL
     */
    isSupabaseUrl(url) {
        return url && typeof url === 'string' && url.includes('supabase.co');
    }

    /**
     * Get storage statistics
     * @returns {Promise<Object>} Storage stats
     */
    async getStorageStats() {
        if (!this.isReady || !this.client) {
            return { error: 'Supabase not available' };
        }

        try {
            const stats = {};
            
            for (const [key, bucketName] of Object.entries(this.buckets)) {
                try {
                    const { data, error } = await this.client.storage
                        .from(bucketName)
                        .list('', { limit: 1000 });
                    
                    if (!error) {
                        stats[key] = {
                            count: data.length,
                            totalSize: data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
                        };
                    }
                } catch (err) {
                    stats[key] = { error: err.message };
                }
            }
            
            return stats;
        } catch (error) {
            return { error: error.message };
        }
    }
}

// Create global instance
const SupabaseStorage = new SupabaseStorageManager();

// Make globally available
window.SupabaseStorage = SupabaseStorage;

console.log('📦 Supabase Storage module loaded');