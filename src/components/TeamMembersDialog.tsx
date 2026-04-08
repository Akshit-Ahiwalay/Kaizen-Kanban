import { useEffect, useState } from "react";
import type { CreateTeamMemberInput, TeamMember } from "@/features/board/types";
import {
  DEFAULT_TEAM_MEMBER_COLOR,
  TEAM_MEMBER_COLORS,
  getInitials,
  withAlpha,
} from "@/features/team/types";
import { Input } from "@/components/ui/input";

interface TeamMembersDialogProps {
  open: boolean;
  members: TeamMember[];
  onOpenChange: (open: boolean) => void;
  onCreateMember: (input: CreateTeamMemberInput) => Promise<boolean>;
}
const fieldLabelClassName =
  "block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66";

const TeamMembersDialog = ({
  open,
  members,
  onOpenChange,
  onCreateMember,
}: TeamMembersDialogProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_TEAM_MEMBER_COLOR);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setColor(DEFAULT_TEAM_MEMBER_COLOR);
    setError("");
    setIsSaving(false);
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    setIsSaving(true);
    setError("");

    const didCreate = await onCreateMember({
      name: trimmedName,
      color,
    });

    setIsSaving(false);

    if (!didCreate) {
      setError("Save issue");
      return;
    }

    setName("");
    setColor(DEFAULT_TEAM_MEMBER_COLOR);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-foreground/12 px-3 py-4 backdrop-blur-[3px] sm:items-center sm:px-4 sm:py-8">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close team members dialog"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden border border-border/30 bg-[hsl(var(--background)/0.96)] p-5 shadow-[0_28px_90px_-48px_rgba(0,0,0,0.42)] backdrop-blur-[10px] max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
          <div>
            <p className="font-display text-[11px] tracking-[0.32em] text-muted-foreground/56">
              TEAM
            </p>
            <h2 className="mt-3 font-display text-[28px] text-foreground/84">Members</h2>
          </div>
          <button
            type="button"
            className="text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <div className="mb-6 flex max-h-44 flex-wrap gap-2.5 overflow-y-auto pr-1 sm:mb-7 sm:max-h-52">
          {members.length === 0 ? (
            <div className="w-full border border-dashed border-border/24 bg-[hsl(var(--background)/0.48)] px-4 py-5 text-center font-body text-[13px] text-muted-foreground/60">
              No members yet
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="inline-flex items-center gap-2.5 border border-border/22 bg-[hsl(var(--background)/0.54)] px-3 py-2.5 shadow-[inset_0_1px_0_hsl(var(--background)/0.58)]"
              >
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-body uppercase tracking-[0.08em]"
                  style={{
                    color: member.color,
                    borderColor: withAlpha(member.color, "3d"),
                    backgroundColor: withAlpha(member.color, "14"),
                  }}
                >
                  {getInitials(member.name)}
                </span>
                <span className="font-body text-[13px] text-foreground/80">{member.name}</span>
              </div>
            ))
          )}
        </div>

        <form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="space-y-6 overflow-y-auto pr-1">
            <div className="space-y-2.5">
            <label htmlFor="team-member-name" className={fieldLabelClassName}>
              Name
            </label>
            <Input
              id="team-member-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Member name"
            />
            </div>

            <div className="space-y-2.5">
              <p className={fieldLabelClassName}>
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {TEAM_MEMBER_COLORS.map((swatch) => {
                  const isSelected = swatch === color;

                  return (
                    <button
                      key={swatch}
                      type="button"
                      aria-label={`Choose member color ${swatch}`}
                      className={`h-9 w-9 rounded-full border transition-transform duration-200 ${
                        isSelected ? "scale-105 border-foreground/26" : "border-border/20"
                      }`}
                      style={{ backgroundColor: swatch }}
                      onClick={() => setColor(swatch)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border/18 pt-5 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-[1rem] font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground/48">
              {error || (isSaving ? "Saving" : "")}
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full border border-border/32 bg-[hsl(var(--background)/0.42)] px-4.5 py-2.5 text-[11px] font-body uppercase tracking-[0.18em] text-foreground/74 transition-all duration-300 hover:border-border/56 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/38 sm:w-auto"
            >
              {isSaving ? "Saving..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamMembersDialog;
