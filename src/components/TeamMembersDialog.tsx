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

      <div className="relative z-10 w-full max-w-md border border-border/35 bg-background/95 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.35em] text-muted-foreground/50">
              TEAM
            </p>
            <h2 className="mt-2 font-display text-2xl text-foreground/80">Members</h2>
          </div>
          <button
            type="button"
            className="text-xs font-body uppercase tracking-[0.2em] text-muted-foreground/55 transition-colors duration-300 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {members.length === 0 ? (
            <div className="w-full border border-dashed border-border/22 bg-background/35 px-4 py-4 text-center font-body text-xs text-muted-foreground/54">
              No members yet
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="inline-flex items-center gap-2 border border-border/22 bg-background/45 px-2.5 py-2"
              >
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-body uppercase tracking-[0.08em]"
                  style={{
                    color: member.color,
                    borderColor: withAlpha(member.color, "3d"),
                    backgroundColor: withAlpha(member.color, "14"),
                  }}
                >
                  {getInitials(member.name)}
                </span>
                <span className="font-body text-xs text-foreground/76">{member.name}</span>
              </div>
            ))
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="team-member-name"
              className="mb-2 block font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60"
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
              className="w-full border border-border/30 bg-background/70 px-3 py-2.5 font-body text-sm text-foreground/80 outline-none transition-colors duration-300 placeholder:text-muted-foreground/35 focus:border-border/60"
            />
          </div>

          <div>
            <p className="mb-2 font-body text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
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
                    className={`h-8 w-8 rounded-full border transition-transform duration-200 ${
                      isSelected ? "scale-105 border-foreground/24" : "border-border/18"
                    }`}
                    style={{ backgroundColor: swatch }}
                    onClick={() => setColor(swatch)}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="font-body text-[10px] uppercase tracking-[0.16em] text-muted-foreground/40">
              {error || (isSaving ? "Saving" : "")}
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="border border-border/30 px-4 py-2 text-[10px] font-body uppercase tracking-[0.2em] text-foreground/70 transition-all duration-300 hover:border-border/55 hover:text-foreground disabled:cursor-not-allowed disabled:border-border/18 disabled:text-muted-foreground/38"
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
