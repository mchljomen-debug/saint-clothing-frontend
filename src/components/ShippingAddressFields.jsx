import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const getItemCode = (item) =>
  String(item?.code ?? item?.psgcCode ?? item?.psgc_id ?? item?.id ?? "");

const getItemName = (item) =>
  item?.name ??
  item?.regionName ??
  item?.provinceName ??
  item?.cityName ??
  item?.municipalityName ??
  item?.cityMunicipalityName ??
  item?.area_name ??
  "";

const getBarangayCode = (item) =>
  String(item?.code ?? item?.psgcCode ?? item?.psgc_id ?? item?.id ?? "");

const getBarangayName = (item) =>
  item?.name ?? item?.barangayName ?? item?.brgyName ?? item?.area_name ?? "";

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

  const safeList = (res) => (Array.isArray(res.data?.data) ? res.data.data : []);

  const fetchRegions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/address/regions`);
      setRegions(safeList(res));
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
      setProvinces(safeList(res));
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
      setCities(safeList(res));
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
      setBarangays(safeList(res));
    } catch (error) {
      console.log("BARANGAYS ERROR:", error?.response?.data || error.message);
      toast.error("Failed to load barangays");
    }
  };

  useEffect(() => {
    fetchRegions();
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
          const value = String(e.target.value);
          const selected = regions.find(
            (r) => String(getItemCode(r)) === String(value)
          );
          const isNCR = value === "1300000000";

          setFormData((prev) => ({
            ...prev,
            region: getItemName(selected),
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
          setSkipProvince(isNCR);

          if (!value) return;

          if (isNCR) {
            await fetchCities(value, "");
          } else {
            await fetchProvinces(value);
          }
        }}
        className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        disabled={readOnly}
      >
        <option value="">Select Region</option>
        {regions.map((r, index) => {
          const code = getItemCode(r);
          const name = getItemName(r);

          return (
            <option key={`${code}-${index}`} value={code}>
              {name}
            </option>
          );
        })}
      </select>

      {!skipProvince && (
        <select
          value={formData.psgcProvinceCode || ""}
          onChange={async (e) => {
            const value = String(e.target.value);
            const selected = provinces.find(
              (p) => String(getItemCode(p)) === String(value)
            );

            setFormData((prev) => ({
              ...prev,
              province: getItemName(selected),
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
          {provinces.map((p, index) => {
            const code = getItemCode(p);
            const name = getItemName(p);

            return (
              <option key={`${code}-${index}`} value={code}>
                {name}
              </option>
            );
          })}
        </select>
      )}

      <select
        value={formData.psgcMunicipalityCode || ""}
        onChange={async (e) => {
          const value = String(e.target.value);
          const selected = cities.find(
            (c) => String(getItemCode(c)) === String(value)
          );

          setFormData((prev) => ({
            ...prev,
            city: getItemName(selected),
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
        {cities.map((c, index) => {
          const code = getItemCode(c);
          const name = getItemName(c);

          return (
            <option key={`${code}-${index}`} value={code}>
              {name}
            </option>
          );
        })}
      </select>

      <select
        value={formData.psgcBarangayCode || ""}
        onChange={(e) => {
          const value = String(e.target.value);
          const selected = barangays.find(
            (b) => String(getBarangayCode(b)) === String(value)
          );

          setFormData((prev) => ({
            ...prev,
            barangay: getBarangayName(selected),
            psgcBarangayCode: value,
          }));
        }}
        className={`${selectClass} ${readOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
        disabled={readOnly || !barangays.length}
      >
        <option value="">Select Barangay</option>
        {barangays.map((b, index) => {
          const code = getBarangayCode(b);
          const name = getBarangayName(b);

          return (
            <option key={`${code}-${index}`} value={code}>
              {name}
            </option>
          );
        })}
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