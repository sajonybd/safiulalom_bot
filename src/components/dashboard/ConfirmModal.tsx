import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSettings } from "@/contexts/SettingsContext";

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmModal({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "destructive",
}: ConfirmModalProps) {
  const { t } = useSettings();

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-4 md:p-5 gap-3">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-foreground">
            {title || t("confirm_action") || "Are you sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
            {description || t("confirm_description") || "This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex gap-3">
          <AlertDialogCancel className="rounded-xl border-border hover:bg-muted text-sm font-semibold transition-all">
            {cancelText || t("cancel") || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
              onOpenChange(false);
            }}
            className={`rounded-xl px-6 py-2 text-sm font-bold shadow-lg transition-all active:scale-95 ${
              variant === "destructive" 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20" 
                : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20"
            }`}
          >
            {confirmText || t("confirm") || "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
