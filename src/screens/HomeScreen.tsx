import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Button,
  StyleSheet,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { MaterialIcons } from "@expo/vector-icons";

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  userId: string;
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchText, setSearchText] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  // Fetch only logged-in user's tasks
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Task[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(list);
    });
    return unsub;
  }, []);

  const handleAddTask = async () => {
    if (title.trim() === "") return;

    await addDoc(collection(db, "tasks"), {
      title,
      description,
      deadline: selectedDate.toISOString().split("T")[0],
      priority,
      completed: false,
      userId: auth.currentUser?.uid, // 👈 store userId
    });

    setTitle("");
    setDescription("");
    setPriority("Medium");
    setSelectedDate(new Date());
    setModalVisible(false);

    Keyboard.dismiss();
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    const ref = doc(db, "tasks", id);
    await updateDoc(ref, { completed: !completed });
  };

  const handleDelete = async (id: string) => {
    const ref = doc(db, "tasks", id);
    await deleteDoc(ref);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const getPriorityColor = (priority: "High" | "Medium" | "Low") => {
    switch (priority) {
      case "High":
        return "red";
      case "Medium":
        return "orange";
      case "Low":
        return "green";
    }
  };

  const sortedTasks = tasks.sort((a, b) => {
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    if (priorityOrder[b.priority] !== priorityOrder[a.priority])
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const filteredTasks = sortedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const incompleteTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  const onChangeDate = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My To-Do List</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        placeholder="Search tasks..."
        placeholderTextColor="#888" // 👈 fix dark mode
        value={searchText}
        onChangeText={setSearchText}
        style={styles.input}
      />

      {/* Incomplete */}
      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Incomplete Tasks</Text>
      <FlatList
        data={incompleteTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity
              onPress={() => toggleComplete(item.id, item.completed)}
            >
              <Text
                style={{
                  textDecorationLine: item.completed ? "line-through" : "none",
                  color: getPriorityColor(item.priority),
                }}
              >
                {item.title} | {item.description} | {item.deadline} |{" "}
                {item.priority}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <MaterialIcons name="delete" size={25} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Completed */}
      <Text style={{ fontWeight: "bold", marginTop: 20 }}>Completed Tasks</Text>
      <FlatList
        data={completedTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity
              onPress={() => toggleComplete(item.id, item.completed)}
            >
              <Text
                style={{
                  textDecorationLine: item.completed ? "line-through" : "none",
                  color: getPriorityColor(item.priority),
                }}
              >
                {item.title} | {item.description} | {item.deadline} |{" "}
                {item.priority}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <MaterialIcons name="delete" size={25} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Button title="Logout" onPress={handleLogout} color="red" />

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>Add Task</Text>

              <TextInput
                placeholder="Title"
                placeholderTextColor="#888" // 👈 fix dark mode
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
              <TextInput
                placeholder="Description"
                placeholderTextColor="#888" // 👈 fix dark mode
                value={description}
                onChangeText={setDescription}
                style={styles.input}
              />

              <View style={{ marginBottom: 10 }}>
                <Button
                  title={`Select Deadline: ${
                    selectedDate.toISOString().split("T")[0]
                  }`}
                  onPress={() => setShowDatePicker(true)}
                />
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                  />
                )}
              </View>

              <View style={styles.priorityContainer}>
                {(["High", "Medium", "Low"] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor:
                          priority === p ? getPriorityColor(p) : "#ccc",
                      },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={styles.priorityButtonText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: 10 }}>
                <Button title="Add Task" onPress={handleAddTask} color="#007bff" />
                <View style={{ marginTop: 10 }} />
                <Button
                  title="Cancel"
                  onPress={() => setModalVisible(false)}
                  color="grey"
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  header: { fontSize: 22, fontWeight: "bold" },
  addButton: {
    backgroundColor: "#007bff",
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: { color: "white", fontSize: 25, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    color: "#000",
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  priorityButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  priorityButtonText: { color: "white", fontWeight: "bold" },
  taskItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
});
