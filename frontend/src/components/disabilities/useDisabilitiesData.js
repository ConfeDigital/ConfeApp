import { useState } from "react";
import axios from "../../api";

export const useDisabilitiesData = () => {
  const [data, setData] = useState({ groups: [], disabilities: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [groupsRes, disabilitiesRes] = await Promise.all([
        axios.get("api/discapacidad/disability-groups/"),
        axios.get("api/discapacidad/disabilities/"),
      ]);

      setData({
        groups: groupsRes.data,
        disabilities: disabilitiesRes.data,
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  const handleCreateOrUpdate = async (formData, tabIndex) => {
    try {
      const endpoint = tabIndex === 0
        ? "api/discapacidad/disability-groups/"
        :  "api/discapacidad/disabilities/";
  
      const payload = { name: formData.name };
  
      if (tabIndex === 1) {
        payload.group_id = formData.group;
      } 
  
      if (formData.id) {
        await axios.put(`${endpoint}${formData.id}/`, payload);
      } else {
        await axios.post(endpoint, payload);
      }
  
      await fetchData();
      return true;
    } catch (error) {
      console.error("Error saving entry:", error.response?.data || error);
      return false;
    }
  };

  const handleDelete = async (id, tabIndex) => {
    try {
      const endpoint = tabIndex === 0
        ? `api/discapacidad/disability-groups/${id}/`
        :  `api/discapacidad/disabilities/${id}/`;

      await axios.delete(endpoint);
      await fetchData();
      return true;
    } catch (error) {
      console.error("Error deleting entry:", error);
      return false;
    }
  };

  return {
    data,
    fetchData,
    handleCreateOrUpdate,
    handleDelete,
    isLoading
  };
};