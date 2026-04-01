/**
 * 공통 UI 유틸리티
 */

/**
 * 삭제 확인 모달을 열고 확인 시 onConfirm 콜백을 실행합니다.
 * - overlayId: 모달 오버레이 요소의 id
 * - confirmBtnId: 확인 버튼 id
 * - cancelBtnId: 취소 버튼 id
 * - onConfirm: 확인 시 실행할 콜백
 */
function openConfirmModal(overlayId, confirmBtnId, cancelBtnId, onConfirm) {
  const overlay = document.getElementById(overlayId)
  overlay.classList.add('open')

  function handleConfirm() { onConfirm(); cleanup() }
  function handleCancel() { cleanup() }
  function handleOverlay(e) { if (e.target === overlay) cleanup() }

  function cleanup() {
    overlay.classList.remove('open')
    document.getElementById(confirmBtnId).removeEventListener('click', handleConfirm)
    document.getElementById(cancelBtnId).removeEventListener('click', handleCancel)
    overlay.removeEventListener('click', handleOverlay)
  }

  document.getElementById(confirmBtnId).addEventListener('click', handleConfirm)
  document.getElementById(cancelBtnId).addEventListener('click', handleCancel)
  overlay.addEventListener('click', handleOverlay)
}
