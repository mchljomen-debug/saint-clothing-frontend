import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const getItemCode = (item) =>
  String(item?.psgc_id ?? item?.code ?? item?.id ?? "");

const getItemName = (item) => item?.name ?? item?.area_name ?? "";

const getBarangayCode = (item) =>
  String(item?.code ?? item?.psgc_id ?? item?.id ?? "");

const getBarangayName = (item) => item?.name ?? item?.area_name ?? "";

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

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    const regionCode = formData?.psgcRegionCode || "";
    const provinceCode = formData?.psgcProvinceCode || "";
    const municipalityCode = formData?.psgcMunicipalityCode || "";
    const barangayCode = formData?.psgcBarangayCode || "";

    if (!regionCode) return;

    const loadInitialData = async () => {
      try {
        const isNCR = regionCode === "1300000000";
        setSkipProvince(isNCR);

        if (isNCR) {
          const cityRes = await axios.get(`${backendUrl}/api/address/municipalities`, {
            params: { reg: regionCode, prv: "" },
          });

          const cityData = Array.isArray(cityRes.data.data) ? cityRes.data.data : [];
          setCities(cityData);

          if (municipalityCode) {
            const brgyRes = await axios.get(`${backendUrl}/api/address/barangays`, {
              params: { mun: municipalityCode },
            });

            const brgyData = Array.isArray(brgyRes.data.data) ? brgyRes.data.data : [];
            setBarangays(brgyData);

            if (barangayCode && !brgyData.find((b) => getBarangayCode(b) === barangayCode)) {
              setFormData((prev) => ({ ...prev, psgcBarangayCode: "", barangay: "" }));
            }
          }
        } else {
          const provinceRes = await axios.get(`${backendUrl}/api/address/provinces`, {
            params: { reg: regionCode },
          });

          const provinceData = Array.isArray(provinceRes.data.data) ? provinceRes.data.data : [];
          setProvinces(provinceData);

          if (provinceCode) {
            const cityRes = await axios.get(`${backendUrl}/api/address/municipalities`, {
              params: { reg: regionCode, prv: provinceCode },
            });

            const cityData = Array.isArray(cityRes.data.data) ? cityRes.data.data : [];
            setCities(cityData);

            if (municipalityCode) {
              const brgyRes = await axios.get(`${backendUrl}/api/address/barangays`, {
                params: { mun: municipalityCode },
              });

              const brgyData = Array.isArray(brgyRes.data.data) ? brgyRes.data.data : [];
              setBarangays(brgyData);

              if (barangayCode && !brgyData.find((b) => getBarangayCode(b) === barangayCode)) {
                setFormData((prev) => ({ ...prev, psgcBarangayCode: "", barangay: "" }));
              }
            }
          }
        }
      } catch (error) {
        console.log("INITIAL ADDRESS LOAD ERROR:", error);
      }
    };

    loadInitialData();
  }, [backendUrl]);

  const fetchRegions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/regions`);
      setRegions(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      console.log("REGIONS ERROR:", error);
      toast.error("Failed to load regions");
    }
  };

  const fetchProvinces = async (reg) => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/provinces`, {
        params: { reg },
      });
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setProvinces(data);
    } catch (error) {
      console.log("PROVINCES ERROR:", error);
      toast.error("Failed to load provinces");
    }
  };

  const fetchCities = async (reg, prv = "") => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/municipalities`, {
        params: { reg, prv },
      });
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setCities(data);
    } catch (error) {
      console.log("CITIES ERROR:", error);
      toast.error("Failed to load cities");
    }
  };

  const fetchBarangays = async (munCode) => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/barangays`, {
        params: { mun: munCode },
      });
      const data = Array.isArray(res.data.data) ? res.data.data : [];
      setBarangays(data);
    } catch (error) {
      console.log("BARANGAYS ERROR:", error);
      toast.error("Failed to load barangays");
    }
  };

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
          const value = e.target.value;
          const selected = regions.find((r) => getItemCode(r) === value);
          const isNCR = value === "1300000000";

          setFormData((prev) => ({
            ...prev,
            region: getItemName(selected) || "",
            province: "",
            city: "",
            barangay: "",
            psgcRegionCode: value,
            psgcProvinceCode: "",
            psgcMunicipalityCode: "",
            psgcBarangayCode: "",
          }));

          setProvinces([]);
          setCities([]);
          setBarangays([]);

          if (isNCR) {
            setSkipProvince(true);
            if (value) await fetchCities(value, "");
            return;
          }

          setSkipProvince(false);

          if (value) await fetchProvinces(value);
        }}
        className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        disabled={readOnly}
      >
        <option value="">Select Region</option>
        {regions.map((r, index) => (
          <option key={`${getItemCode(r)}-${index}`} value={getItemCode(r)}>
            {getItemName(r)}
          </option>
        ))}
      </select>

      {!skipProvince && (
        <select
          value={formData.psgcProvinceCode || ""}
          onChange={async (e) => {
            const value = e.target.value;
            const selected = provinces.find((p) => getItemCode(p) === value);

            setFormData((prev) => ({
              ...prev,
              province: getItemName(selected) || "",
              city: "",
              barangay: "",
              psgcProvinceCode: value,
              psgcMunicipalityCode: "",
              psgcBarangayCode: "",
            }));

            setCities([]);
            setBarangays([]);

            if (value) {
              await fetchCities(formData.psgcRegionCode, value);
            }
          }}
          className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
          disabled={readOnly || !provinces.length}
        >
          <option value="">Select Province</option>
          {provinces.map((p, index) => (
            <option key={`${getItemCode(p)}-${index}`} value={getItemCode(p)}>
              {getItemName(p)}
            </option>
          ))}
        </select>
      )}

      <select
        value={formData.psgcMunicipalityCode || ""}
        onChange={async (e) => {
          const value = e.target.value;
          const selected = cities.find((c) => getItemCode(c) === value);
          const localityName = getItemName(selected);

          setFormData((prev) => ({
            ...prev,
            city: localityName || "",
            barangay: "",
            psgcMunicipalityCode: value,
            psgcBarangayCode: "",
          }));

          setBarangays([]);

          if (value) {
            await fetchBarangays(value);
          }
        }}
        className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        disabled={readOnly || !cities.length}
      >
        <option value="">Select City / Municipality</option>
        {cities.map((c, index) => (
          <option key={`${getItemCode(c)}-${index}`} value={getItemCode(c)}>
            {getItemName(c)}
          </option>
        ))}
      </select>

      <select
        value={formData.psgcBarangayCode || ""}
        onChange={(e) => {
          const value = e.target.value;
          const selected = barangays.find((b) => getBarangayCode(b) === value);

          setFormData((prev) => ({
            ...prev,
            barangay: getBarangayName(selected) || "",
            psgcBarangayCode: value,
          }));
        }}
        className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        disabled={readOnly || !barangays.length}
      >
        <option value="">Select Barangay</option>
        {barangays.map((b, index) => (
          <option
            key={`${getBarangayCode(b)}-${index}`}
            value={getBarangayCode(b)}
          >
            {getBarangayName(b)}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="ZIP Code"
        value={formData.zipcode || ""}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, zipcode: e.target.value }))
        }
        className={`${inputClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        readOnly={readOnly}
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