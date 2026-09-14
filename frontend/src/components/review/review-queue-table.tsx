import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ReviewItem } from "@/types/review";

export function ReviewQueueTable({ items }: { items: ReviewItem[] }) {
  const t = useTranslations("review");

  const statusLabel: Record<ReviewItem["status"], string> = {
    pending: t("statusPending"),
    approved: t("statusApproved"),
    edited_approved: t("statusEditedApproved"),
    rejected: t("statusRejected"),
  };

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>{t("colRequest")}</Th>
          <Th>{t("colSubmitted")}</Th>
          <Th>{t("colStakes")}</Th>
          <Th>{t("colStatus")}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {items.map((item) => (
          <Tr key={item.id}>
            <Td>
              {/* The question is the link, not the practice area: every row
                  in this queue currently shares the same practice area, so
                  linking that gave a lawyer a column of identical labels
                  and forced them to read the smaller line underneath to
                  tell two items apart. */}
              <Link
                href={`/review/${item.id}`}
                className="line-clamp-2 font-medium text-primary hover:underline"
              >
                {item.question}
              </Link>
              <p className="mt-0.5 text-xs text-muted">{item.practiceArea}</p>
            </Td>
            <Td className="whitespace-nowrap text-muted">
              <bdi dir="ltr">{new Date(item.submittedAt).toLocaleString()}</bdi>
            </Td>
            <Td>
              {item.difficulty === "high_stakes" ? (
                <Badge variant="flagged">{t("highStakes")}</Badge>
              ) : (
                <Badge variant="neutral">{t("routine")}</Badge>
              )}
            </Td>
            <Td>
              <Badge variant={item.status === "pending" ? "neutral" : "verified"}>
                {statusLabel[item.status]}
              </Badge>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
