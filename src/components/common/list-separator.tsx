import { StyleSheet, View } from 'react-native';

/** Gap between rows of a FlatList (its content container can't use `gap` alongside a header). */
export function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: {
    height: 8,
  },
});
