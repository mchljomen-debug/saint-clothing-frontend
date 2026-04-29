import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const normalizeItem = (item = {}) => {
  const code = String(
    item.code ||
      item.psgcCode ||
      item.psgc_id ||
      item.psgc10DigitCode ||
      item.regionCode ||
      item.provinceCode ||
      item.cityCode ||
      item.municipalityCode ||
      item.id ||
      ""
  );

  const name = String(
    item.name ||
      item.regionName ||
      item.provinceName ||
      item.cityName ||
      item.municipalityName ||
      item.cityMunicipalityName ||
      item.area_name ||
      ""
  );

  return { code, name };
};

const normalizeList = (payload) => {
  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : [];

  return list
    .map(normalizeItem)
    .filter((item) => item.code && item.name);
};

const ShippingAddressFields = ({
  formData,
  setFormData,
  backendUrl,
  readOnly = false,
  className = "",
}) => {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [skipProvince, setSkipProvince] = useState(false);

  const inputClass =
    "bg-white border border-black/10 py-3 px-4 w-full outline-none rounded-xl text-sm font-semibold text-[#0A0D17] placeholder:text-gray-300 focus:border-black";

  const selectClass =
    "bg-white border border-black/10 py-3 px-4 w-full outline-none rounded-xl text-sm font-semibold text-[#0A0D17] focus:border-black";

  const fetchRegions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/regions`);
      setRegions(normalizeList(res.data));
    } catch (error) {
      console.log("REGIONS ERROR:", error?.response?.data || error.message);
      toast.error("Failed to load regions");
    }
  };

  const fetchProvinces = async (reg) => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/provinces`, {
        params: { reg },
      });
      setProvinces(normalizeList(res.data));
    } catch (error) {
      console.log("PROVINCES ERROR:", error?.response?.data || error.message);
      toast.error("Failed to load provinces");
    }
  };

  const fetchCities = async (reg, prv = "") => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/municipalities`, {
        params: { reg, prv },
      });
      setCities(normalizeList(res.data));
    } catch (error) {
      console.log("CITIES ERROR:", error?.response?.data || error.message);
      toast.error("Failed to load cities");
    }
  };

  const fetchBarangays = async (mun) => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/barangays`, {
        params: { mun },
      });
      setBarangays(normalizeList(res.data));
    } catch (error) {
      console.log("BARANGAYS ERROR:", error?.response?.data || error.message);
      toast.error("Failed to load barangays");
    }
  };

  useEffect(() => {
    if (backendUrl) fetchRegions();
  }, [backendUrl]);

  useEffect(() => {
    const regionCode = formData?.psgcRegionCode || "";
    const provinceCode = formData?.psgcProvinceCode || "";
    const municipalityCode = formData?.psgcMunicipalityCode || "";

    if (!regionCode) return;

    const loadSavedDropdowns = async () => {
      const isNCR = String(regionCode) === "1300000000";
      setSkipProvince(isNCR);

      if (isNCR) {
        await fetchCities(regionCode, "");
      } else {
        await fetchProvinces(regionCode);
        if (provinceCode) {
          await fetchCities(regionCode, provinceCode);
        }
      }

      if (municipalityCode) {
        await fetchBarangays(municipalityCode);
      }
    };

    loadSavedDropdowns();
  }, [
    backendUrl,
    formData?.psgcRegionCode,
    formData?.psgcProvinceCode,
    formData?.psgcMunicipalityCode,
  ]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}>
      <input
        type="text"
        placeholder="House / Unit / Bldg"
        value={formData.houseUnit || ""}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, houseUnit: e.target.value }))
        }
        className={`${inputClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        readOnly={readOnly}
      />

      <input
        type="text"
        placeholder="Street / Block / Lot"
        value={formData.street || ""}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, street: e.target.value }))
        }
        className={`${inputClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        readOnly={readOnly}
      />

      <select
        value={formData.psgcRegionCode || ""}
        onChange={async (e) => {
          const code = e.target.value;
          const selected = regions.find((item) => item.code === code);
          const isNCR = code === "1300000000";

          setFormData((prev) => ({
            ...prev,
            region: selected?.name || "",
            province: "",
            city: "",
            barangay: "",
            psgcRegionCode: code,
            psgcProvinceCode: "",
            psgcMunicipalityCode: "",
            psgcBarangayCode: "",
          }));

          setProvinces([]);
          setCities([]);
          setBarangays([]);
          setSkipProvince(isNCR);

          if (!code) return;

          if (isNCR) {
            await fetchCities(code, "");
          } else {
            await fetchProvinces(code);
          }
        }}
        className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        disabled={readOnly}
      >
        <option value="">Select Region</option>
        {regions.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>

      {!skipProvince && (
        <select
          value={formData.psgcProvinceCode || ""}
          onChange={async (e) => {
            const code = e.target.value;
            const selected = provinces.find((item) => item.code === code);

            setFormData((prev) => ({
              ...prev,
              province: selected?.name || "",
              city: "",
              barangay: "",
              psgcProvinceCode: code,
              psgcMunicipalityCode: "",
              psgcBarangayCode: "",
            }));

            setCities([]);
            setBarangays([]);

            if (code) {
              await fetchCities(formData.psgcRegionCode, code);
            }
          }}
          className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
          disabled={readOnly || !provinces.length}
        >
          <option value="">Select Province</option>
          {provinces.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={formData.psgcMunicipalityCode || ""}
        onChange={async (e) => {
          const code = e.target.value;
          const selected = cities.find((item) => item.code === code);

          setFormData((prev) => ({
            ...prev,
            city: selected?.name || "",
            barangay: "",
            psgcMunicipalityCode: code,
            psgcBarangayCode: "",
          }));

          setBarangays([]);

          if (code) {
            await fetchBarangays(code);
          }
        }}
        className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        disabled={readOnly || !cities.length}
      >
        <option value="">Select City / Municipality</option>
        {cities.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>

      <select
        value={formData.psgcBarangayCode || ""}
        onChange={(e) => {
          const code = e.target.value;
          const selected = barangays.find((item) => item.code === code);

          setFormData((prev) => ({
            ...prev,
            barangay: selected?.name || "",
            psgcBarangayCode: code,
          }));
        }}
        className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        disabled={readOnly || !barangays.length}
      >
        <option value="">Select Barangay</option>
        {barangays.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="ZIP Code"
        value={formData.zipcode || ""}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            zipcode: e.target.value.replace(/\D/g, ""),
          }))
        }
        className={`${inputClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        readOnly={readOnly}
        maxLength={4}
      />

      <input
        type="text"
        placeholder="Country"
        value={formData.country || "Philippines"}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, country: e.target.value }))
        }
        className={`${inputClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        readOnly={readOnly}
      />
    </div>
  );
};

export default ShippingAddressFields;