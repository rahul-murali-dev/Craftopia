
import { MapPin } from "lucide-react";
import AddressCard from "./AddressCard";

export default function AddressList({
  addresses,
  onEdit,
  onDelete,
  onSetDefault,
}) {
  if (addresses.length === 0) {
    return (
      <div className="py-12 text-center">
        <MapPin
          size={42}
          className="mx-auto text-[#8B6248]"
        />

        <h2 className="mt-4 font-semibold text-[#30231E]">
          No saved addresses
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Add an address to manage your delivery locations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
        />
      ))}
    </div>
  );
}
