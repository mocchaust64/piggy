import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { supabase } from '@/lib/supabaseClient'

/**
 * StorageService - Senior-level service for handling image picking,
 * cropping, and Supabase Storage uploads.
 */
class StorageService {
  /**
   * Pick an image from the device gallery and crop it to a square.
   */
  async pickAndCropImage(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== 'granted') {
      console.warn('[StorageService] Media library permission not granted')
      return null
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (result.canceled || !result.assets[0].uri) {
      return null
    }

    // Further processing if needed (e.g. force specific resolution)
    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 400, height: 400 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    )

    return manipulated.uri
  }

  /**
   * Upload an image to Supabase Storage and return the public URL.
   */
  async uploadAvatar(userId: string, uri: string): Promise<string | null> {
    try {
      // 1. Prepare file blob/arrayBuffer from URI
      // React Native fetch can handle local file URIs to get a blob
      const response = await fetch(uri)
      const blob = await response.blob()

      const fileExt = 'jpg'
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const filePath = fileName

      // 2. Upload to 'avatars' bucket
      const { error } = await supabase.storage.from('avatars').upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      })

      if (error) throw error

      // 3. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('[StorageService] Upload error:', error)
      return null
    }
  }
}

export const storageService = new StorageService()
