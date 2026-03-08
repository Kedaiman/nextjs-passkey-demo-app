"use client";

export default function PasskeyDeleteButton({ id }: { id: string }) {
  async function handleDelete() {
    const res = await fetch("/api/passkey/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert("削除に失敗しました");
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="mt-2 text-xs text-red-500 hover:text-red-700"
    >
      削除
    </button>
  );
}
