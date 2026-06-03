declare module 'react-native' {
  import type * as React from 'react';

  export type ViewStyle = Record<string, unknown>;
  export type TextStyle = Record<string, unknown>;
  export type ImageStyle = Record<string, unknown>;
  export type StyleProp<T> = T | Array<StyleProp<T>> | false | null | undefined;

  export interface ViewProps {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
  }

  export interface PressableProps extends ViewProps {
    onPress?: () => void;
  }

  export interface TextProps extends ViewProps {
    onPress?: () => void;
  }

  export interface TextInputProps extends ViewProps {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    autoCapitalize?: string;
    keyboardType?: string;
  }

  export const View: React.ComponentType<ViewProps>;
  export const Text: React.ComponentType<TextProps>;
  export const ScrollView: React.ComponentType<ViewProps & { showsVerticalScrollIndicator?: boolean; contentContainerStyle?: StyleProp<ViewStyle> }>;
  export const Pressable: React.ComponentType<PressableProps>;
  export const SafeAreaView: React.ComponentType<ViewProps>;
  export const KeyboardAvoidingView: React.ComponentType<ViewProps & { behavior?: string }>;
  export const TextInput: React.ComponentType<TextInputProps>;
  export const Platform: { OS: 'ios' | 'android' | 'web' };
  export const StyleSheet: {
    create<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T): T;
  };
}

declare module 'expo' {
  import type * as React from 'react';

  export function registerRootComponent(component: React.ComponentType): void;
}
