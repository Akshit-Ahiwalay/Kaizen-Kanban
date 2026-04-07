import { useEffect, useState } from "react";
import type { CreateTeamMemberInput, TeamMember } from "@/features/board/types";
import {
  DEFAULT_TEAM_MEMBER_COLOR,
  TEAM_MEMBER_COLORS,
  getInitials,
  withAlpha,
} from "@/features/team/types";

interface TeamMembersDialogProps {
  open: boolean;
  members: TeamMember[];
  onOpenChange: (open: boolean) => void;
  onCreateMember: (input: CreateTeamMemberInput) => Promise<boolean>;
}

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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-foreground/10 px-4 py-8 backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close team members dialog"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 w-full max-w-lg border border-border/36 bg-background/95 p-7 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[11px] tracking-[0.32em] text-muted-foreground/56">
              TEAM
            </p>
            <h2 className="mt-2.5 font-display text-[28px] text-foreground/84">Members</h2>
          </div>
          <button
            type="button"
            className="text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground/60 transition-colors duration-300 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2.5">
          {members.length === 0 ? (
            <div className="w-full border border-dashed border-border/24 bg-background/36 px-4 py-5 text-center font-body text-[13px] text-muted-foreground/60">
              No members yet
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="inline-flex items-center gap-2.5 border border-border/24 bg-background/45 px-3 py-2.5"
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

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="team-member-name"
              className="mb-2.5 block font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66"
            >
              Name
            </label>
            <input
              id="team-member-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Member name"
              className="w-full border border-border/32 bg-background/72 px-3.5 py-3 font-body text-[15px] text-foreground/84 outline-none transition-colors duration-300 placeholder:text-muted-foreground/40 focus:border-border/62"
            />
          </div>

          <div>
            <p className="mb-2.5 font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground/66">
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

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground/48">
              {error || (isSaving ? "Saving" : "")}
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="border border-border/32 px-4.5 py-2.5 text-[11px] font-body uppercase tracking-[0.18em] text-foreground/74 transition-all duration-300 hover:border-border/56 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/38"
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
