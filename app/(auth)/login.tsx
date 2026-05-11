import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { fonts } from '@/constants/design';
import { MetallicButton } from '@/components/ui/MetallicButton';

function TriangleOutline() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 20, height: 17 }}>
      <View
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderBottomWidth: 17,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#8A8070',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 3,
          width: 0,
          height: 0,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderBottomWidth: 12,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#07070D',
        }}
      />
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  function handleGoogleLogin() {
    Alert.alert('Em breve', 'Login com Google em breve.');
  }

  function handleAppleLogin() {
    Alert.alert('Em breve', 'Login com Apple em breve.');
  }

  function handleEmailLogin() {
    router.push('/(auth)/register');
  }

  function handleCreateAccount() {
    router.push('/(auth)/register');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Watermark */}
      <Text style={styles.watermark}>R A X I S</Text>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <TriangleOutline />
        <Text style={styles.title}>P R A X I S</Text>
        <Text style={styles.subtitle}>N U T R I T I O N</Text>

        {/* Login methods */}
        <Text style={styles.enterWith}>ENTRAR COM</Text>

        {/* Google Button */}
        <Pressable style={styles.socialButton} onPress={handleGoogleLogin}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.socialButtonText}>CONTINUAR COM GOOGLE</Text>
        </Pressable>

        {/* Apple Button */}
        <Pressable style={[styles.socialButton, { marginTop: 12 }]} onPress={handleAppleLogin}>
          <Text style={styles.appleIcon}>&#63743;</Text>
          <Text style={styles.socialButtonText}>CONTINUAR COM APPLE</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Button */}
        <MetallicButton
          variant="primary"
          label="ENTRAR COM E-MAIL"
          onPress={handleEmailLogin}
        />

        {/* Create account link */}
        <Pressable onPress={handleCreateAccount} style={styles.createAccountContainer}>
          <Text style={styles.createAccountText}>
            Sem conta?{' '}
            <Text style={styles.createAccountHighlight}>Criar agora</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG,
    paddingHorizontal: 20,
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.serifLight,
    fontSize: 80,
    color: Colors.WH,
    opacity: 0.06,
    zIndex: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontFamily: fonts.serifLight,
    fontSize: 28,
    letterSpacing: 8,
    color: Colors.WH,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: fonts.sansLight,
    fontSize: 10,
    letterSpacing: 6,
    color: Colors.W3,
    marginTop: 4,
  },
  enterWith: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.W3,
    marginTop: 32,
    marginBottom: 16,
    textAlign: 'center',
  },
  socialButton: {
    height: 52,
    width: '100%',
    backgroundColor: Colors.C2,
    borderWidth: 0.5,
    borderColor: Colors.B1,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  googleIcon: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: '#4285F4',
    marginRight: 12,
  },
  appleIcon: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: Colors.WH,
    marginRight: 12,
  },
  socialButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.W2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.W4,
  },
  dividerText: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: Colors.W4,
    marginHorizontal: 12,
  },
  createAccountContainer: {
    marginTop: 24,
  },
  createAccountText: {
    fontFamily: fonts.sansLight,
    fontSize: 12,
    color: Colors.W3,
    textAlign: 'center',
  },
  createAccountHighlight: {
    fontFamily: fonts.sansLight,
    fontStyle: 'italic',
    color: Colors.WH,
  },
});
