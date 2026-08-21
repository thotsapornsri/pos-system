import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

export const IMAGES_KEY = (storeId: string) => ['images', storeId] as const;

export interface ImageEntry {
  url: string;
  updatedAt: string;
}

const BUCKET = 'images';

// One shared query per store, listing every object under "<storeId>/" —
// every <ImageSlot> asks for the same queryKey, so React Query dedupes it
// into a single Storage `list()` call no matter how many slots are on the
// page (e.g. one per product tile on the Selling page).
export function useImagesQuery(storeId: string | undefined) {
  return useQuery({
    queryKey: IMAGES_KEY(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<Record<string, ImageEntry>> => {
      const { data, error } = await supabase.storage.from(BUCKET).list(storeId, { limit: 1000 });
      if (error) throw error;
      const map: Record<string, ImageEntry> = {};
      for (const f of data ?? []) {
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(`${storeId}/${f.name}`);
        map[f.name] = { url: pub.publicUrl, updatedAt: f.updated_at ?? f.created_at ?? '' };
      }
      return map;
    },
  });
}

export function useUploadImageMutation(storeId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      if (!storeId) throw new Error('No store loaded yet.');
      const { error } = await supabase.storage.from(BUCKET).upload(`${storeId}/${id}`, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (storeId) void qc.invalidateQueries({ queryKey: IMAGES_KEY(storeId) });
    },
  });
}
