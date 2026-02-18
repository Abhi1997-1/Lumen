import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function MeetingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    // TODO: Fetch meeting from Supabase
    const meeting = {
        id,
        title: 'Team Standup',
        date: 'February 9, 2024',
        duration: '5 min 32 sec',
        transcript: 'This is a placeholder transcript. The actual transcript will be loaded from Supabase once the integration is complete. It should be easy to read with good line height and contrast.\n\nSpeaker 1: Hello everyone, let\'s start.\nSpeaker 2: Sure, I have an update on the design system.',
        summary: 'Key points discussed:\n• Design system updates\n• Mobile app UI refresh\n• Timeline for next release',
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <StatusBar barStyle="light-content" />

            {/* Header Info - Large & Clean */}
            <View style={styles.header}>
                <Text style={styles.date}>{meeting.date}</Text>
                <Text style={styles.title}>{meeting.title}</Text>
                <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.duration}>{meeting.duration}</Text>
                </View>
            </View>

            {/* Content Sections - No Cards, Just Whitespace */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Summary</Text>
                <Text style={styles.summaryText}>{meeting.summary}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Transcript</Text>
                <Text style={styles.transcriptText}>{meeting.transcript}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 24,
        paddingTop: 40,
        paddingBottom: 80,
    },
    header: {
        marginBottom: 40,
    },
    date: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
        lineHeight: 40,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    duration: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    section: {
        marginBottom: 30,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 26,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 30,
    },
    transcriptText: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 28,
    },
});
