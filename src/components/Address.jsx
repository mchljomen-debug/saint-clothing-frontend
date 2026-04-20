import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import NavBar from "../components/NavBar";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

const emptyAddress = {
  houseUnit: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  region: "",
  zipcode: "",
  country: "Philippines",
  latitude: "",
  longitude: "",
  psgcRegionCode: "",
  psgcProvinceCode: "",
  psgcMunicipalityCode: "",
  psgcBarangayCode: "",
};

const getFirstName = (user) => {
  if (user?.firstName?.trim()) return user.firstName;
  if (user?.name?.trim()) return user.name.trim().split(" ")[0] || "";
  return "";
};

const getLastName = (user) => {
  if (user?.lastName?.trim()) return user.lastName;
  if (user?.name?.trim()) return user.name.trim().split(" ").slice(1).join(" ");
  return "";
};

export default function MyAccount({ navigation }) {
  const { user, setUser, backendUrl, token } = useContext(ShopContext);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [firstName, setFirstName] = useState(getFirstName(user));
  const [lastName, setLastName] = useState(getLastName(user));
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(String(user?.phone || "").replace(/\D/g, ""));
  const [address, setAddress] = useState({
    ...emptyAddress,
    ...(user?.address || {}),
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(getFirstName(user));
      setLastName(getLastName(user));
      setEmail(user?.email || "");
      setPhone(String(user?.phone || "").replace(/\D/g, ""));
      setAddress({
        ...emptyAddress,
        ...(user?.address || {}),
      });
      setAvatarPreview(user?.avatar || "");
      setAvatarFile(null);
    }
  }, [user]);

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    if (address.region) {
      loadProvinces(address.region);
    } else {
      setProvinces([]);
    }
  }, [address.region]);

  useEffect(() => {
    if (address.province) {
      loadCities(address.province);
    } else {
      setCities([]);
    }
  }, [address.province]);

  useEffect(() => {
    if (address.city) {
      loadBarangays(address.city);
    } else {
      setBarangays([]);
    }
  }, [address.city]);

  const getAvatarSource = () => {
    if (avatarFile?.uri) return { uri: avatarFile.uri };

    if (avatarPreview) {
      if (typeof avatarPreview === "string" && avatarPreview.startsWith("file://")) {
        return { uri: avatarPreview };
      }

      if (typeof avatarPreview === "string" && avatarPreview.startsWith("http")) {
        return { uri: avatarPreview };
      }

      if (typeof avatarPreview === "string" && avatarPreview.startsWith("/")) {
        return { uri: `${backendUrl}${avatarPreview}` };
      }

      if (typeof avatarPreview === "string") {
        return { uri: `${backendUrl}/${avatarPreview}` };
      }
    }

    return assets.profile_icon;
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow gallery access first.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const picked = result.assets[0];
      setAvatarFile(picked);
      setAvatarPreview(picked.uri);
    }
  };

  const handlePhoneChange = (value) => {
    setPhone(value.replace(/\D/g, ""));
  };

  const loadRegions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/regions`);
      setRegions(res.data?.regions || res.data || []);
    } catch (error) {
      console.log("REGIONS ERROR:", error?.response?.data || error.message);
    }
  };

  const loadProvinces = async (region) => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/provinces`, {
        params: { region },
      });
      setProvinces(res.data?.provinces || res.data || []);
    } catch (error) {
      console.log("PROVINCES ERROR:", error?.response?.data || error.message);
    }
  };

  const loadCities = async (province) => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/cities`, {
        params: { province },
      });
      setCities(res.data?.cities || res.data || []);
    } catch (error) {
      console.log("CITIES ERROR:", error?.response?.data || error.message);
    }
  };

  const loadBarangays = async (city) => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/barangays`, {
        params: { locality: city },
      });
      setBarangays(res.data?.barangays || res.data || []);
    } catch (error) {
      console.log("BARANGAYS ERROR:", error?.response?.data || error.message);
    }
  };

  const validateProfile = () => {
    if (!firstName.trim()) {
      Alert.alert("VALIDATION ERROR", "First name is required.");
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert("VALIDATION ERROR", "Last name is required.");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("VALIDATION ERROR", "Email is required.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("VALIDATION ERROR", "Enter a valid email address.");
      return false;
    }

    if (!phone.trim()) {
      Alert.alert("VALIDATION ERROR", "Contact number is required.");
      return false;
    }

    if (!/^\d+$/.test(phone)) {
      Alert.alert("VALIDATION ERROR", "Contact number must contain numbers only.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!user?._id || !token) {
      Alert.alert("AUTH ERROR", "Authentication required.");
      return;
    }

    if (!validateProfile()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("address", JSON.stringify(address));

      if (avatarFile?.uri) {
        const fileName = avatarFile.fileName || `avatar-${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

        formData.append("avatar", {
          uri: avatarFile.uri,
          name: fileName,
          type,
        });
      }

      const res = await axios.post(
        `${backendUrl}/api/user/update-profile/${user._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.success) {
        const updatedUser = {
          ...res.data.user,
          firstName: res.data.user?.firstName || firstName,
          lastName: res.data.user?.lastName || lastName,
          name:
            res.data.user?.name ||
            `${res.data.user?.firstName || firstName} ${res.data.user?.lastName || lastName}`.trim(),
          phone: res.data.user?.phone || phone,
        };

        setUser(updatedUser);
        setAvatarFile(null);
        setAvatarPreview(updatedUser.avatar || avatarPreview);
        setIsEditing(false);
        Alert.alert("SUCCESS", "Profile updated successfully.");
      } else {
        Alert.alert("UPDATE ERROR", res.data?.message || "Update failed.");
      }
    } catch (err) {
      Alert.alert(
        "UPDATE ERROR",
        err?.response?.data?.message || "Update failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("VALIDATION ERROR", "Fill in all password fields.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await axios.post(
        `${backendUrl}/api/user/change-password`,
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            token,
          },
        }
      );

      if (res.data?.success) {
        Alert.alert("SUCCESS", "Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("PASSWORD ERROR", res.data?.message || "Password update failed.");
      }
    } catch (err) {
      Alert.alert(
        "PASSWORD ERROR",
        err?.response?.data?.message || "Password update failed."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setFirstName(getFirstName(user));
    setLastName(getLastName(user));
    setEmail(user?.email || "");
    setPhone(String(user?.phone || "").replace(/\D/g, ""));
    setAddress({
      ...emptyAddress,
      ...(user?.address || {}),
    });
    setAvatarPreview(user?.avatar || "");
  };

  const formatAddressPreview = () => {
    const parts = [
      address.houseUnit,
      address.street,
      address.barangay,
      address.city,
      address.province,
      address.region,
      address.zipcode,
      address.country,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "No main address saved";
  };

  const PickerField = ({ label, selectedValue, onValueChange, items }) => (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          <Picker.Item label={`Select ${label.toLowerCase()}`} value="" />
          {items.map((item, index) => {
            const value =
              typeof item === "string"
                ? item
                : item.name || item.locality || item.city || item.province || item.region || "";

            return <Picker.Item key={`${value}-${index}`} label={value} value={value} />;
          })}
        </Picker>
      </View>
    </View>
  );

  const InfoField = ({
    label,
    value,
    onChange,
    isEditingField,
    secureTextEntry = false,
    keyboardType = "default",
    maxLength,
  }) => (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>

      {isEditingField ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
          placeholder={`Enter ${label.toLowerCase()}...`}
          placeholderTextColor="#C9C9C9"
          style={styles.infoInput}
        />
      ) : (
        <Text style={[styles.infoValue, !value && styles.infoValueEmpty]}>
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );

  const displayName =
    `${getFirstName(user)} ${getLastName(user)}`.trim() ||
    user?.name ||
    "Guest";

  return (
    <View style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.85}
          >
            <MaterialIcons name="arrow-back" size={18} color="#8A8A8A" />
            <Text style={styles.backText}>BACK TO PROFILE</Text>
          </TouchableOpacity>

          <View style={styles.layout}>
            <View style={styles.leftCard}>
              <View style={styles.avatarWrap}>
                <Image source={getAvatarSource()} style={styles.profileImage} />

                {isEditing && (
                  <TouchableOpacity
                    style={styles.cameraBtn}
                    onPress={pickImage}
                    activeOpacity={0.85}
                  >
                    <MaterialIcons name="photo-camera" size={18} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.verifiedText}>VERIFIED ACCOUNT</Text>
              <Text style={styles.nameText}>{displayName.toUpperCase()}</Text>
              <Text style={styles.refText}>
                REF: {user?._id ? String(user._id).slice(-8).toUpperCase() : "UNKNOWN"}
              </Text>
            </View>

            <View style={styles.rightArea}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>IDENTITY DETAILS</Text>
                    <Text style={styles.sectionSub}>
                      Manage your profile information and saved main address
                    </Text>
                  </View>

                  {!isEditing && (
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      activeOpacity={0.85}
                      style={styles.editBtn}
                    >
                      <Text style={styles.editBtnText}>EDIT PROFILE</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.rowGrid}>
                    <View style={{ flex: 1 }}>
                      <InfoField
                        label="FIRST NAME"
                        value={firstName}
                        onChange={setFirstName}
                        isEditingField={isEditing}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <InfoField
                        label="LAST NAME"
                        value={lastName}
                        onChange={setLastName}
                        isEditingField={isEditing}
                      />
                    </View>
                  </View>

                  <InfoField
                    label="EMAIL ADDRESS"
                    value={email}
                    onChange={setEmail}
                    isEditingField={isEditing}
                    keyboardType="email-address"
                  />

                  <InfoField
                    label="CONTACT NUMBER"
                    value={phone}
                    onChange={handlePhoneChange}
                    isEditingField={isEditing}
                    keyboardType="numeric"
                    maxLength={11}
                  />

                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>MAIN SHIPPING ADDRESS</Text>

                    {!isEditing ? (
                      <Text style={styles.infoValue}>{formatAddressPreview()}</Text>
                    ) : (
                      <>
                        <InfoField
                          label="HOUSE / UNIT"
                          value={address.houseUnit}
                          onChange={(text) =>
                            setAddress((prev) => ({ ...prev, houseUnit: text }))
                          }
                          isEditingField={true}
                        />

                        <InfoField
                          label="STREET"
                          value={address.street}
                          onChange={(text) =>
                            setAddress((prev) => ({ ...prev, street: text }))
                          }
                          isEditingField={true}
                        />

                        <PickerField
                          label="REGION"
                          selectedValue={address.region}
                          onValueChange={(value) =>
                            setAddress((prev) => ({
                              ...prev,
                              region: value,
                              province: "",
                              city: "",
                              barangay: "",
                            }))
                          }
                          items={regions}
                        />

                        <PickerField
                          label="PROVINCE"
                          selectedValue={address.province}
                          onValueChange={(value) =>
                            setAddress((prev) => ({
                              ...prev,
                              province: value,
                              city: "",
                              barangay: "",
                            }))
                          }
                          items={provinces}
                        />

                        <PickerField
                          label="CITY"
                          selectedValue={address.city}
                          onValueChange={(value) =>
                            setAddress((prev) => ({
                              ...prev,
                              city: value,
                              barangay: "",
                            }))
                          }
                          items={cities}
                        />

                        <PickerField
                          label="BARANGAY"
                          selectedValue={address.barangay}
                          onValueChange={(value) =>
                            setAddress((prev) => ({
                              ...prev,
                              barangay: value,
                            }))
                          }
                          items={barangays}
                        />

                        <InfoField
                          label="ZIP CODE"
                          value={address.zipcode}
                          onChange={(text) =>
                            setAddress((prev) => ({ ...prev, zipcode: text }))
                          }
                          isEditingField={true}
                          keyboardType="numeric"
                        />
                      </>
                    )}
                  </View>
                </View>

                {isEditing && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSave}
                      activeOpacity={0.85}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={handleCancel}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.cancelBtnText}>CANCEL</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.passwordHead}>
                  <View style={styles.passwordIconWrap}>
                    <MaterialIcons name="lock-outline" size={22} color="#111111" />
                  </View>

                  <View>
                    <Text style={styles.sectionTitle}>CHANGE PASSWORD</Text>
                    <Text style={styles.sectionSub}>
                      Update your account security
                    </Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <InfoField
                    label="CURRENT PASSWORD"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    isEditingField={true}
                    secureTextEntry
                  />

                  <InfoField
                    label="NEW PASSWORD"
                    value={newPassword}
                    onChange={setNewPassword}
                    isEditingField={true}
                    secureTextEntry
                  />

                  <InfoField
                    label="CONFIRM NEW PASSWORD"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    isEditingField={true}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.passwordBtn}
                  onPress={handleChangePassword}
                  activeOpacity={0.85}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.passwordBtnText}>CHANGE PASSWORD</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footerWrap}>
                <Text style={styles.footerText}>SAINT ACCOUNT ARCHIVE</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <NavBar active="profile" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F8F8F6",
  },

  scrollContent: {
    paddingTop: 96,
    paddingBottom: 120,
    paddingHorizontal: 16,
  },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 8,
  },

  backText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8A8A8A",
    letterSpacing: 1.8,
  },

  layout: {
    gap: 16,
  },

  leftCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.78)",
    padding: 22,
    alignItems: "center",
  },

  avatarWrap: {
    width: 138,
    height: 138,
    borderRadius: 69,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },

  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  cameraBtn: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },

  verifiedText: {
    marginTop: 18,
    fontSize: 10,
    fontWeight: "900",
    color: "#8A8A8A",
    letterSpacing: 2.2,
  },

  nameText: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: "900",
    color: "#111111",
    textTransform: "uppercase",
    textAlign: "center",
  },

  refText: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "800",
    color: "#B0B0B0",
    letterSpacing: 1.6,
  },

  rightArea: {
    gap: 16,
  },

  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.78)",
    padding: 18,
  },

  sectionHeader: {
    marginBottom: 18,
    gap: 12,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#111111",
    letterSpacing: 2.3,
  },

  sectionSub: {
    marginTop: 6,
    fontSize: 10,
    color: "#8F8F8F",
    letterSpacing: 0.6,
  },

  editBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  editBtnText: {
    color: "#111111",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#FFFFFF",
    padding: 16,
  },

  rowGrid: {
    flexDirection: "row",
    gap: 12,
  },

  infoField: {
    marginBottom: 18,
  },

  infoLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#A3A3A3",
    letterSpacing: 1.8,
    marginBottom: 8,
  },

  infoValue: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    color: "#111111",
    textTransform: "uppercase",
  },

  infoValueEmpty: {
    color: "#C9C9C9",
    fontStyle: "italic",
  },

  infoInput: {
    borderWidth: 1,
    borderColor: "#E7E7E7",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 10,
  },

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },

  picker: {
    height: 52,
    width: "100%",
  },

  actionRow: {
    marginTop: 18,
    gap: 12,
  },

  saveBtn: {
    backgroundColor: "#111111",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  saveBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  cancelBtn: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FFF",
  },

  cancelBtnText: {
    color: "#666666",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  passwordHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  passwordIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  passwordBtn: {
    marginTop: 18,
    backgroundColor: "#111111",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  passwordBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  footerWrap: {
    paddingTop: 8,
    opacity: 0.6,
  },

  footerText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "#777777",
  },
});