import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Placeholder data
const mockMeetings = [
    { id: '1', title: 'Team Standup', date: 'Today', duration: '5:32' },
    { id: '2', title: 'Product Review', date: 'Yesterday', duration: '12:45' },
    { id: '3', title: 'Design Sync', date: 'Feb 7', duration: '45:10' },
];

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header / Greeting */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Good Evening,</Text>
                <Text style={styles.username}>Alex</Text>
            </View>

            {/* Quick Stats - Minimal Text Only */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>3</Text>
                    <Text style={styles.statLabel}>Recordings</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>63m</Text>
                    <Text style={styles.statLabel}>Transcribed</Text>
                </View>
            </View>

            {/* List Header */}
            <Text style={styles.sectionTitle}>Recent</Text>

            {/* Meetings List */}
            <FlatList
                data={mockMeetings}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <Link href={`/meeting/${item.id}`} asChild>
                        <TouchableOpacity style={styles.meetingItem}>
                            <View style={styles.meetingInfo}>
                                <Text style={styles.meetingTitle}>{item.title}</Text>
                                <Text style={styles.meetingMeta}>{item.date} • {item.duration}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </Link>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No recordings yet</Text>
                    </View>
                }
            />

            {/* Floating Record Button - Minimal */}
            <Link href="/record" asChild>
                <TouchableOpacity style={styles.fab}>
                    <View style={styles.fabInner} />
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 80,
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 40,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '300',
        color: Colors.textSecondary,
    },
    username: {
        fontSize: 28,
        fontWeight: '600',
        color: Colors.text,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 50,
    },
    statItem: {
        marginRight: 40,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
        marginRight: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 20,
    },
    listContent: {
        paddingBottom: 100,
    },
    meetingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    meetingInfo: {
        flex: 1,
    },
    meetingTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: Colors.text,
        marginBottom: 4,
    },
    meetingMeta: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary, // White
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    fabInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.error, // Red dot for 'Record'
    },
});
