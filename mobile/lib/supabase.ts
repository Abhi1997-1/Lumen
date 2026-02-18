/**
 * Supabase client for React Native
 * Uses the same database as the web app
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Types matching the web app
export interface Meeting {
    id: string;
    user_id: string;
    title: string;
    audio_url: string;
    transcript: string | null;
    summary: string | null;
    action_items: string[] | null;
    key_decisions: string[] | null;
    status: 'pending' | 'processing' | 'complete' | 'failed';
    created_at: string;
    model_used: string | null;
}

/**
 * Fetch all meetings for the current user
 */
export async function getMeetings(): Promise<Meeting[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Create a new meeting
 */
export async function createMeeting(
    title: string,
    audioPath: string,
    transcript: string
): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Upload audio to storage
    const fileName = `${user.id}/${Date.now()}.m4a`;

    // Use ArrayBuffer for upload
    const base64 = await FileSystem.readAsStringAsync(audioPath, {
        encoding: 'base64',
    });
    const arrayBuffer = decode(base64);

    const { error: uploadError } = await supabase.storage
        .from('meetings')
        .upload(fileName, arrayBuffer, {
            contentType: 'audio/m4a',
            upsert: false,
        });

    if (uploadError) throw uploadError;

    // Create meeting record
    const { data, error } = await supabase
        .from('meetings')
        .insert({
            user_id: user.id,
            title: title || 'Untitled Recording',
            audio_url: fileName,
            transcript: transcript,
            status: 'complete',
            model_used: 'whisper-base-native',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get a single meeting by ID
 */
export async function getMeeting(id: string): Promise<Meeting | null> {
    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}
