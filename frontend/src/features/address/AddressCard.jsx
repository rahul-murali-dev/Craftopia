
import { MapPin, Pencil, Trash2, Check } from "lucide-react";

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <MapPin
            size={22}
            className="mt-1 text-[#8B6248]"
          />

          <div>
            <h2 className="font-semibold text-[#30231E]">
              {address.full_name}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              {address.phone}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              {address.address_line}, {address.city},{" "}
              {address.state} - {address.pincode}
            </p>
          </div>
        </div>

        {address.is_default && (
          <span className="rounded-full bg-[#F8F4ED] px-3 py-1 text-xs font-semibold text-[#5C3A2E]">
            Default
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="flex items-center gap-2 text-sm font-medium text-[#5C3A2E] hover:underline"
        >
          <Pencil size={16} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(address.id)}
          className="flex items-center gap-2 text-sm font-medium text-red-600 hover:underline"
        >
          <Trash2 size={16} />
          Delete
        </button>

        {!address.is_default && (
          <button
            type="button"
            onClick={() => onSetDefault(address)}
            className="flex items-center gap-2 text-sm font-medium text-[#8B6248] hover:underline"
          >
            <Check size={16} />
            Set as Default
          </button>
        )}
      </div>
    </div>
  );
}
