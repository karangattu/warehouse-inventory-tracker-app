"use client";

import { useState, useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  createUserAction,
  toggleUserAction,
  resetPinAction,
} from "@/app/actions/admin";
import { formatUserDisplayName } from "@/lib/utils";

interface UserRow {
  id: string;
  name: string;
  role: string | null;
  isActive: number | null;
  createdAt: string | null;
}

interface UsersClientProps {
  users: UserRow[];
}

export function UsersClient({ users }: UsersClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPinUserId, setResetPinUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleCreateAction = (
    prev: { error?: string; success?: string } | null,
    formData: FormData
  ) => {
    return createUserAction(prev, formData).then((result) => {
      if (result?.success) {
        setToast({ message: result.success, type: "success" });
        setShowCreateModal(false);
      } else if (result?.error) {
        setToast({ message: result.error, type: "error" });
      }
      return result;
    });
  };

  const handleToggleAction = (
    prev: { error?: string; success?: string } | null,
    formData: FormData
  ) => {
    return toggleUserAction(prev, formData).then((result) => {
      if (result?.success) {
        setToast({ message: result.success, type: "success" });
      } else if (result?.error) {
        setToast({ message: result.error, type: "error" });
      }
      return result;
    });
  };

  const handleResetPinAction = (
    prev: { error?: string; success?: string } | null,
    formData: FormData
  ) => {
    return resetPinAction(prev, formData).then((result) => {
      if (result?.success) {
        setToast({ message: result.success, type: "success" });
        setResetPinUserId(null);
      } else if (result?.error) {
        setToast({ message: result.error, type: "error" });
      }
      return result;
    });
  };

  const [, createFormAction, isCreating] = useActionState(
    handleCreateAction,
    null
  );
  const [, toggleFormAction] = useActionState(handleToggleAction, null);
  const [, resetPinFormAction, isResetting] = useActionState(
    handleResetPinAction,
    null
  );

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          User Management
        </h2>
        <Button onClick={() => setShowCreateModal(true)}>+ Add User</Button>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id} padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{formatUserDisplayName(u.name)}</p>
                <p className="text-xs text-gray-500">
                  {u.role === "admin" ? "Admin" : "Madam"} ·{" "}
                  {u.isActive === 1 ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResetPinUserId(u.id)}
                >
                  Reset PIN
                </Button>
                <form action={toggleFormAction}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input
                    type="hidden"
                    name="isActive"
                    value={u.isActive === 1 ? "0" : "1"}
                  />
                  <Button variant="ghost" size="sm" type="submit">
                    {u.isActive === 1 ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create User modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
      >
        <form action={createFormAction} className="space-y-3">
          <Input name="name" label="Name" required />
          <Input
            name="pin"
            label="4-Digit PIN"
            maxLength={4}
            pattern="[0-9]{4}"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            >
              <option value="operator">Madam</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? "Creating..." : "Create User"}
          </Button>
        </form>
      </Modal>

      {/* Reset PIN modal */}
      <Modal
        open={!!resetPinUserId}
        onClose={() => setResetPinUserId(null)}
        title="Reset PIN"
      >
        <form action={resetPinFormAction} className="space-y-3">
          <input type="hidden" name="userId" value={resetPinUserId || ""} />
          <Input
            name="newPin"
            label="New 4-Digit PIN"
            maxLength={4}
            pattern="[0-9]{4}"
            required
          />
          <Button type="submit" disabled={isResetting} className="w-full">
            {isResetting ? "Resetting..." : "Reset PIN"}
          </Button>
        </form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
