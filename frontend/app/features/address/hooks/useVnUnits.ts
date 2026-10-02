import { useEffect, useState } from "react";
import { fetchDistricts, fetchProvinces, fetchWards, type Unit } from "../api/vn-units";

type Level = { items: Unit[]; loading: boolean; error: string | null };
const idle: Level = { items: [], loading: false, error: null };

function useLevel(parent: number | null | "root", loader: (code: number, signal: AbortSignal) => Promise<Unit[]>): Level {
  const [state, setState] = useState<Level>(idle);
  useEffect(() => {
    if (parent === null) {
      setState(idle);
      return;
    }
    const controller = new AbortController();
    setState({ items: [], loading: true, error: null });
    loader(parent === "root" ? 0 : parent, controller.signal)
      .then((items) => setState({ items, loading: false, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ items: [], loading: false, error: error instanceof Error ? error.message : "Không tải được danh mục." });
      });
    return () => controller.abort();
    // loader là hàm module-level ổn định
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent]);
  return state;
}

const byName = (items: Unit[], name: string) => items.find((u) => u.name === name)?.code ?? null;

/**
 * Cascade tỉnh → quận → phường. Giá trị lưu là TÊN; mã chỉ dùng để tải cấp dưới.
 * Khi sửa địa chỉ cũ, tên đã lưu được khớp lại với danh mục để nạp cấp dưới.
 */
export function useVnUnits(city: string, district: string) {
  const provinces = useLevel("root", (_c, s) => fetchProvinces(s));
  const provinceCode = byName(provinces.items, city);
  const districts = useLevel(provinceCode, fetchDistricts);
  const districtCode = byName(districts.items, district);
  const wards = useLevel(districtCode, fetchWards);
  return { provinces, districts, wards };
}
