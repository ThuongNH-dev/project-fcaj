import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import { NotificationBellButton } from "./NotificationBellButton";

function renderButton(unreadCount: number, isOpen = false) {
  const onClick = vi.fn();

  render(
    <LanguageProvider>
      <NotificationBellButton
        isOpen={isOpen}
        onClick={onClick}
        unreadCount={unreadCount}
      />
    </LanguageProvider>,
  );

  return onClick;
}

describe("NotificationBellButton", () => {
  it("hides the badge when there are no unread notifications", () => {
    renderButton(0);

    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the unread count and includes it in the accessible name", () => {
    const onClick = renderButton(3, true);
    const button = screen.getByRole("button", {
      name: "Notifications, 3 unread notifications",
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-controls", "notifications-popover");

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("caps the visual count at 99+ while preserving the exact accessible count", () => {
    renderButton(125);

    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Notifications, 125 unread notifications",
      }),
    ).toBeInTheDocument();
  });

  it("normalizes negative counts to zero", () => {
    renderButton(-2);

    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
  });
});
