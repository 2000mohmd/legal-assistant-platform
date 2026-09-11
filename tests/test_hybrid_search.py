from mizan.retrieval.hybrid_search import reciprocal_rank_fusion


def test_single_list_preserves_order():
    fused = reciprocal_rank_fusion([["a", "b", "c"]])
    assert [doc_id for doc_id, _ in fused] == ["a", "b", "c"]


def test_agreement_across_lists_boosts_rank():
    dense = ["a", "b", "c"]
    bm25 = ["b", "a", "c"]
    fused = reciprocal_rank_fusion([dense, bm25])
    ids = [doc_id for doc_id, _ in fused]
    # "a" and "b" each appear near the top of both lists and should outrank
    # "c", which is last in both.
    assert ids.index("c") == 2


def test_item_missing_from_one_list_still_included():
    dense = ["a", "b"]
    bm25 = ["c"]
    fused = reciprocal_rank_fusion([dense, bm25])
    ids = {doc_id for doc_id, _ in fused}
    assert ids == {"a", "b", "c"}


def test_exact_match_boosted_by_agreement_beats_single_list_top_rank():
    # Simulates the motivating case: an exact article lookup that BM25
    # finds at rank 1 and dense also finds (just not first) should outrank
    # something dense alone ranks first but BM25 never finds at all.
    dense = ["irrelevant-1", "exact-article-74", "irrelevant-2"]
    bm25 = ["exact-article-74"]
    fused = reciprocal_rank_fusion([dense, bm25])
    assert fused[0][0] == "exact-article-74"


def test_scores_are_sorted_descending():
    fused = reciprocal_rank_fusion([["a", "b"], ["b", "a"]])
    scores = [score for _, score in fused]
    assert scores == sorted(scores, reverse=True)
