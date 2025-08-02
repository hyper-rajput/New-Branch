import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';

const FullScreenLoader = ({ visible }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#0288D1" />
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FullScreenLoader;
