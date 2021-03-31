const objectToFormData = (obj) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([key, val]) => fd.append(key, val));
  return fd;
};
