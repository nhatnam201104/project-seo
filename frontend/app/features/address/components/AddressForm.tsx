import { useState } from "react";
import { Form, Link, useNavigation } from "react-router";
import { UnderlineField, UnderlineSelect } from "~/components/store/UnderlineField";
import { useVnUnits } from "../hooks/useVnUnits";
import type { Address } from "../api/address.types";
import type { AddressActionData } from "../services/address-action.server";

type Props = { address?: Address | null; result?: AddressActionData; submitLabel: string };

export function AddressForm({ address, result, submitLabel }: Props) {
  const navigation = useNavigation();
  const busy = navigation.state === "submitting";
  const [city, setCity] = useState(address?.city ?? "");
  const [district, setDistrict] = useState(address?.district ?? "");
  const [ward, setWard] = useState(address?.ward ?? "");
  const { provinces, districts, wards } = useVnUnits(city, district);
  const errors = result?.fieldErrors ?? {};
  const toOptions = (items: { name: string }[]) => items.map((u) => ({ value: u.name, label: u.name }));
  const loadError = provinces.error ?? districts.error ?? wards.error;

  return (
    <Form method="post" className="sp-form" aria-busy={busy}>
      {result?.error ? <p className="sp-alert sp-alert--error" role="alert" style={{ marginTop: 24 }}>{result.error}</p> : null}

      <section className="sp-section" aria-labelledby="receiver-heading">
        <header><h2 id="receiver-heading">Người nhận</h2><span>Bắt buộc</span></header>
        <div className="sp-form-grid">
          <UnderlineField label="Tên người nhận" name="receiver_name" required defaultValue={address?.receiver_name ?? ""} autoComplete="name" error={errors.receiver_name} />
          <UnderlineField label="Số điện thoại" name="receiver_phone" type="tel" required defaultValue={address?.receiver_phone ?? ""} autoComplete="tel" hint="Dùng để liên hệ giao hàng" error={errors.receiver_phone} />
        </div>
      </section>

      <section className="sp-section" aria-labelledby="location-heading">
        <header><h2 id="location-heading">Địa chỉ</h2><span>Nơi nhận hàng</span></header>
        <UnderlineField label="Số nhà, tên đường" name="line" required defaultValue={address?.line ?? ""} placeholder="Ví dụ: 12 Nguyễn Huệ" autoComplete="address-line1" error={errors.line} />
        <div className="sp-form-grid">
          <UnderlineSelect label="Tỉnh / Thành phố" name="city" required value={city} placeholder="Chọn tỉnh / thành phố" loading={provinces.loading}
            options={toOptions(provinces.items)} error={errors.city} onChange={(v) => { setCity(v); setDistrict(""); setWard(""); }} />
          <UnderlineSelect label="Quận / Huyện" name="district" required value={district} placeholder="Chọn quận / huyện" loading={districts.loading}
            disabled={!city} hint={!city ? "Chọn tỉnh / thành phố trước" : undefined}
            options={toOptions(districts.items)} error={errors.district} onChange={(v) => { setDistrict(v); setWard(""); }} />
          <UnderlineSelect label="Phường / Xã" name="ward" required value={ward} placeholder="Chọn phường / xã" loading={wards.loading}
            disabled={!district} hint={!district ? "Chọn quận / huyện trước" : undefined}
            options={toOptions(wards.items)} error={errors.ward} onChange={setWard} />
        </div>
        {loadError ? <p className="sp-field__msg sp-field__msg--error" role="alert">{loadError} Vui lòng tải lại trang.</p> : null}
        <label className="sp-check"><input type="checkbox" name="is_default" defaultChecked={address?.is_default ?? false} /> Đặt làm địa chỉ mặc định</label>
        <div className="sp-actions">
          <Link className="sp-btn sp-btn--ghost" to="/account/addresses">Hủy</Link>
          <button className="sp-btn" type="submit" disabled={busy}>{busy ? "Đang lưu…" : submitLabel}</button>
        </div>
      </section>
    </Form>
  );
}
