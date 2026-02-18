import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { transcribeAudio } from '../lib/whisper';
import { createMeeting } from '../lib/supabase';
import { Colors } from '../constants/Colors';

type RecordingState = 'idle' | 'recording' | 'processing';

export default function RecordScreen() {
    const [state, setState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [transcriptionProgress, setTranscriptionProgress] = useState('');
    const recordingRef = useRef<Audio.Recording | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Request permissions on mount
        Audio.requestPermissionsAsync();
        Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            recordingRef.current = recording;
            setState('recording');
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration((d) => d + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        if (!recordingRef.current) return;

        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setState('processing');
        setTranscriptionProgress('Stopping...');

        try {
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;

            if (uri) {
                setTranscriptionProgress('Transcribing...');
                const transcript = await transcribeAudio(uri, (progress) => {
                    setTranscriptionProgress(progress);
                });

                console.log('Transcript:', transcript);
                setTranscriptionProgress('Saving...');

                try {
                    const meeting = await createMeeting(
                        `New Recording ${new Date().toLocaleTimeString()}`,
                        uri,
                        transcript
                    );

                    router.replace(`/meeting/${meeting.id}`);
                } catch (saveError: any) {
                    console.error('Save failed:', saveError);
                    Alert.alert('Save Failed', 'Could not save meeting to cloud: ' + saveError.message);
                    setState('idle');
                }
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
            setState('idle');
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Close Button */}
            {state === 'idle' && (
                <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
            )}

            {/* Main Content Area */}
            <View style={styles.content}>
                {/* Timer Display */}
                <Text style={styles.timer}>{formatDuration(duration)}</Text>

                {/* Status Label */}
                <Text style={styles.statusLabel}>
                    {state === 'idle' && 'Ready to record'}
                    {state === 'recording' && 'Recording...'}
                    {state === 'processing' && transcriptionProgress}
                </Text>

                {/* Visualizer Placeholder - Minimal Line */}
                <View style={styles.visualizerContainer}>
                    {state === 'recording' && (
                        <View style={styles.recordingDot} />
                    )}
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                {state === 'idle' && (
                    <TouchableOpacity style={styles.mainActionBtn} onPress={startRecording}>
                        <View style={styles.recordIcon} />
                    </TouchableOpacity>
                )}
                {state === 'recording' && (
                    <TouchableOpacity style={styles.mainActionBtn} onPress={stopRecording}>
                        <View style={styles.stopIcon} />
                    </TouchableOpacity>
                )}
                {state === 'processing' && (
                    <ActivityIndicator size="large" color={Colors.primary} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 60,
        right: 30,
        zIndex: 10,
        padding: 10,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timer: {
        fontSize: 80,
        fontWeight: '200',
        color: Colors.text,
        fontVariant: ['tabular-nums'],
        letterSpacing: 2,
    },
    statusLabel: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 20,
        letterSpacing: 0.5,
    },
    visualizerContainer: {
        height: 40,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
    },
    controls: {
        paddingBottom: 80,
        alignItems: 'center',
    },
    mainActionBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: Colors.textSecondary, // Ring
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.error,
    },
    stopIcon: {
        width: 30,
        height: 30,
        borderRadius: 4,
        backgroundColor: Colors.text, // White square for stop
    },
});
