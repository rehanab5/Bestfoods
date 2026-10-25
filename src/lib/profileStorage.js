const KEY = "bf_profile";

const DEFAULT = {
  name: "",
  phone: "",
  email: "",
  street: "",
  floor: "",
  area: "",
  zip: "",
  location: "",
};

export function getProfile() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProfile(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT, ...data }));
  } catch {
    /* ignore */
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}