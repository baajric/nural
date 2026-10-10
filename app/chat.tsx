import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IllustrationPanel } from '@/components/illustration-panel';
import { Button } from '@/components/ui/button';
import { Fonts, palettes, PAPER_INK, Radius, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useOnboarding } from '@/contexts/onboarding-context';
import { useTheme, useThemedStyles } from '@/contexts/theme-context';
import {
  checkComprehension,
  continueReflectionChat,
  startReflectionChat,
  USER_TURNS_BEFORE_SUMMARY,
} from '@/lib/aiChat';
import type { ReflectionSummary, Session } from '@/lib/aiChat';
import { completeSession, DEFAULT_SESSION_MINUTES } from '@/lib/progress';
import { getSession } from '@/lib/sessionCache';
import { supabase } from '@/lib/supabase';

type MessageBubble = {
  id: string;
  role: 'ai' | 'user';
  content: string;
  /** AI: a connection error; tapping it retries */
  failed?: boolean;
  /** AI: the answer didn't show the text was read; offers the way back to the reading */
  nudge?: boolean;
  /** User: 'checking' while the first answer is being judged, 'rejected' if it didn't pass */
  status?: 'checking' | 'accepted' | 'rejected';
};

/** The reflection starts once one answer about the text has been accepted. */
function hasPassedCheck(history: MessageBubble[]): boolean {
  return history.some((m) => m.role === 'user' && m.status === 'accepted');
}

/** The conversation the AI should see: no error bubbles, nudges or rejected answers. */
function acceptedConversation(history: MessageBubble[]) {
  return history
    .filter((m) => (m.role === 'ai' ? !m.failed && !m.nudge : m.status === 'accepted'))
    .map((m) => ({ role: m.role === 'ai' ? ('assistant' as const) : ('user' as const), content: m.content }));
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'unknown error';
}

function TypingIndicator() {
  const styles = useThemedStyles(makeStyles);
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 450, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(anim, { toValue: 0, duration: 450, useNativeDriver: true, easing: Easing.ease }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const rising = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const peaking = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] });
  const falling = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });
  return (
    <View style={[styles.aiCard, styles.typing]} accessibilityLabel="Nural is writing">
      <Animated.View style={[styles.dot, { opacity: rising }]} />
      <Animated.View style={[styles.dot, { opacity: peaking }]} />
      <Animated.View style={[styles.dot, { opacity: falling }]} />
    </View>
  );
}

/** Stores a chat message; failures are logged but never block the conversation. */
function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
  if (!sessionId) return;
  supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content })
    .then(({ error }) => {
      if (error) console.warn('Failed to save chat message', error);
    });
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile, profileId } = useOnboarding();
  const params = useLocalSearchParams<{
    sessionId?: string;
    category?: string;
    sourceTitle?: string;
    minutesRead?: string;
  }>();

  const sessionId = params.sessionId ?? '';
  const category = params.category ?? 'General Knowledge';
  const sourceTitle = params.sourceTitle ?? 'Daily reading';
  const minutesRead = Number(params.minutesRead) || DEFAULT_SESSION_MINUTES;

  const cached = sessionId ? getSession(sessionId) : undefined;
  const sessionForAI: Session = {
    category: cached?.category ?? category,
    sourceTitle: cached?.source_title ?? sourceTitle,
    content: cached?.reading_content ?? '',
  };

  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<MessageBubble[]>([]);
  const [inputText, setInputText] = useState('');
  // Starts true: the opening message is requested as soon as the screen mounts.
  const [isTyping, setIsTyping] = useState(true);
  const [summaryData, setSummaryData] = useState<ReflectionSummary | null>(null);
  const [completing, setCompleting] = useState(false);

  const passedCheck = hasPassedCheck(messages);
  const userTurns = messages.filter((m) => m.role === 'user' && m.status === 'accepted').length;
  const lastMessage = messages[messages.length - 1];

  const addAIMessage = useCallback(
    (content: string, flags: { failed?: boolean; nudge?: boolean } = {}) => {
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: 'ai', content, ...flags }]);
      if (!flags.failed) saveMessage(sessionId, 'assistant', content);
    },
    [sessionId]
  );

  /** Asks the opening question about the text. Caller sets isTyping to true first. */
  const openConversation = useCallback(async () => {
    if (!profile) return;
    try {
      addAIMessage(await startReflectionChat(sessionForAI, profile));
    } catch (e) {
      console.warn('Gemini error (opening):', e);
      addAIMessage(`I couldn't connect right now (${errorText(e)}). Tap here to try again.`, { failed: true });
    } finally {
      setIsTyping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, sessionId]);

  useEffect(() => {
    // Only open once per chat screen. State is only set after the network call resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    openConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestReply = useCallback(
    async (history: MessageBubble[]) => {
      if (!profile) return;
      setIsTyping(true);
      try {
        if (!hasPassedCheck(history)) {
          // Still on the question about the text: judge the newest answer.
          const question = history.find((m) => m.role === 'ai' && !m.failed && !m.nudge);
          const answer = [...history].reverse().find((m) => m.role === 'user' && m.status === 'checking');
          if (!question || !answer) return;
          const result = await checkComprehension(question.content, answer.content, sessionForAI, profile);
          setMessages((prev) =>
            prev.map((m) => (m.id === answer.id ? { ...m, status: result.read ? 'accepted' : 'rejected' } : m))
          );
          addAIMessage(result.reply, { nudge: !result.read });
          return;
        }

        const result = await continueReflectionChat(acceptedConversation(history), sessionForAI, profile);
        if (typeof result === 'object') {
          setSummaryData(result);
        } else {
          addAIMessage(result);
        }
      } catch (e) {
        console.warn('Gemini error:', e);
        addAIMessage(`I had trouble answering (${errorText(e)}). Tap here to try again.`, { failed: true });
      } finally {
        setIsTyping(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, sessionId, addAIMessage]
  );

  const sendMessage = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping || summaryData) return;
    setInputText('');

    const userMsg: MessageBubble = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      status: hasPassedCheck(messages) ? 'accepted' : 'checking',
    };
    const history = [...messages, userMsg];
    setMessages(history);
    saveMessage(sessionId, 'user', trimmed);
    requestReply(history);
  }, [inputText, isTyping, summaryData, messages, sessionId, requestReply]);

  /** Tapping a failed AI message removes it and retries the same step. */
  const retryFailed = useCallback(
    (failedId: string) => {
      if (isTyping) return;
      const remaining = messages.filter((m) => m.id !== failedId);
      setMessages(remaining);
      if (remaining.some((m) => m.role === 'user' && m.status !== 'rejected')) {
        requestReply(remaining);
      } else {
        setIsTyping(true);
        openConversation();
      }
    },
    [isTyping, messages, requestReply, openConversation]
  );

  const backToReading = useCallback(() => {
    router.replace({
      pathname: '/reading/[id]',
      params: { id: '0', sessionId, category, title: sourceTitle },
    });
  }, [router, sessionId, category, sourceTitle]);

  const handleCompleteSession = useCallback(async () => {
    if (completing) return;
    setCompleting(true);
    try {
      if (sessionId && profileId) await completeSession(profileId, sessionId, minutesRead);
      router.replace('/(tabs)');
    } catch (e) {
      console.warn('Failed to complete session', e);
      Alert.alert('Could not save', 'Please check your internet connection and try again.');
      setCompleting(false);
    }
  }, [completing, sessionId, profileId, minutesRead, router]);

  const canSend = inputText.trim().length > 0 && !isTyping && !summaryData;

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close reflection"
          hitSlop={12}
          style={styles.iconButton}
          onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.turns} accessibilityLabel={`${userTurns} of ${USER_TURNS_BEFORE_SUMMARY} replies`}>
          {Array.from({ length: USER_TURNS_BEFORE_SUMMARY }, (_, i) => (
            <View key={i} style={[styles.turn, i < userTurns && styles.turnDone]} />
          ))}
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {/* What we're reflecting on */}
        <View style={styles.context}>
          <IllustrationPanel category={category} style={styles.contextThumb} />
          <View style={styles.contextText}>
            <Text style={styles.eyebrow}>{passedCheck ? 'Reflecting on' : 'First, about the reading'}</Text>
            <Text style={styles.contextTitle} numberOfLines={2}>
              {sourceTitle}
            </Text>
          </View>
        </View>

        {messages.map((msg) =>
          msg.role === 'ai' ? (
            <Pressable
              key={msg.id}
              disabled={!msg.failed}
              onPress={() => retryFailed(msg.id)}
              style={[styles.aiCard, msg.failed && styles.aiCardFailed, msg.nudge && styles.aiCardNudge]}>
              <Text style={styles.aiLabel}>{msg.failed ? 'Connection problem' : 'Nural'}</Text>
              <Text style={msg.failed ? styles.failedText : styles.aiText}>{msg.content}</Text>
              {/* Only the latest nudge offers the way back; the user can also just answer again. */}
              {msg.nudge && msg.id === lastMessage?.id && (
                <Button
                  label="Back to the reading"
                  variant="secondary"
                  icon="book-open"
                  onPress={backToReading}
                  style={styles.nudgeButton}
                />
              )}
            </Pressable>
          ) : (
            <View key={msg.id} style={[styles.userBubble, msg.status === 'rejected' && styles.userBubbleRejected]}>
              <Text style={styles.userText}>{msg.content}</Text>
            </View>
          )
        )}

        {isTyping && <TypingIndicator />}

        {summaryData && (
          <View style={styles.insight}>
            <Text style={styles.insightEyebrow}>Today&apos;s insight · {category}</Text>
            <Text style={styles.insightTakeaway}>{summaryData.keyTakeaway}</Text>

            <View style={styles.insightRule} />

            <View style={styles.insightRow}>
              <Feather name="target" size={18} color={PAPER_INK} />
              <View style={styles.insightRowText}>
                <Text style={styles.insightLabel}>How it connects to your goal</Text>
                <Text style={styles.insightValue}>{summaryData.connectionToGoals}</Text>
              </View>
            </View>
            <View style={styles.insightRow}>
              <Feather name="sunrise" size={18} color={PAPER_INK} />
              <View style={styles.insightRowText}>
                <Text style={styles.insightLabel}>Tomorrow, try this</Text>
                <Text style={styles.insightValue}>{summaryData.tomorrowChallenge}</Text>
              </View>
            </View>

            <Button
              label="Complete session"
              icon="check"
              onPress={handleCompleteSession}
              loading={completing}
              fixedColors={{ background: PAPER_INK, foreground: palettes.light.paper }}
              style={styles.insightButton}
            />
          </View>
        )}
      </ScrollView>

      {!summaryData && (
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TextInput
            style={styles.input}
            placeholder="Write what comes to mind…"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.gold}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={sendMessage}
            disabled={!canSend}
            style={[styles.send, !canSend && styles.sendDisabled]}>
            <Feather name="arrow-up" size={22} color={colors.onPrimary} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screen - 8,
      paddingBottom: Spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    turns: {
      flexDirection: 'row',
      gap: 6,
    },
    turn: {
      width: 28,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    turnDone: {
      backgroundColor: colors.gold,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    context: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    contextThumb: {
      width: 56,
      height: 56,
      borderRadius: Radius.sm,
    },
    contextText: {
      flex: 1,
    },
    eyebrow: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.goldText,
    },
    contextTitle: {
      fontFamily: Fonts.serifMedium,
      fontSize: 19,
      lineHeight: 24,
      color: colors.text,
      marginTop: 2,
    },
    aiCard: {
      alignSelf: 'stretch',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.lg,
      borderTopLeftRadius: 6,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    aiCardFailed: {
      borderColor: colors.danger,
      borderStyle: 'dashed',
    },
    aiCardNudge: {
      borderColor: colors.gold,
      backgroundColor: colors.goldSoft,
    },
    nudgeButton: {
      marginTop: Spacing.lg,
    },
    aiLabel: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.goldText,
      marginBottom: Spacing.sm,
    },
    aiText: {
      fontFamily: Fonts.serif,
      fontSize: 19,
      lineHeight: 28,
      color: colors.text,
    },
    failedText: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    typing: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      gap: 6,
      paddingVertical: Spacing.lg,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.gold,
    },
    userBubble: {
      alignSelf: 'flex-end',
      maxWidth: '86%',
      backgroundColor: colors.primary,
      borderRadius: Radius.lg,
      borderBottomRightRadius: 6,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.lg,
    },
    userBubbleRejected: {
      opacity: 0.5,
    },
    userText: {
      fontFamily: Fonts.sans,
      fontSize: 16,
      lineHeight: 24,
      color: colors.onPrimary,
    },
    // The insight is a printed card: paper and ink in both themes.
    insight: {
      backgroundColor: colors.paper,
      borderRadius: Radius.lg,
      padding: Spacing.xl,
      marginTop: Spacing.sm,
    },
    insightEyebrow: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: PAPER_INK,
      opacity: 0.65,
    },
    insightTakeaway: {
      fontFamily: Fonts.serifMedium,
      fontSize: 24,
      lineHeight: 32,
      color: PAPER_INK,
      marginTop: Spacing.sm,
    },
    insightRule: {
      height: 1,
      backgroundColor: 'rgba(28, 36, 56, 0.15)',
      marginVertical: Spacing.lg,
    },
    insightRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    insightRowText: {
      flex: 1,
    },
    insightLabel: {
      fontFamily: Fonts.sansSemiBold,
      fontSize: 13,
      color: PAPER_INK,
    },
    insightValue: {
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 23,
      color: PAPER_INK,
      opacity: 0.85,
      marginTop: 2,
    },
    insightButton: {
      marginTop: Spacing.xs,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.screen,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 130,
      fontFamily: Fonts.sans,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingTop: 13,
      paddingBottom: 13,
    },
    send: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: {
      opacity: 0.3,
    },
  });
