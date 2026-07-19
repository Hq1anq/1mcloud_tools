import { useRef } from 'react'
import { useTranslation } from '../../i18n'
import { usePopMenu } from '../../context/PopMenuContext'

/**
 * ControlButton — gear icon that opens the VPS action menu popup.
 *
 * Props:
 *  onUpgrade — callback for the Upgrade action
 *  onPause   — callback for the Pause action (requires confirmation)
 *  onReboot  — callback for the Reboot action (requires confirmation)
 */
export default function ControlButton({
  onUpgrade,
  onPause,
  onReboot,
  onReset,
  onRefund,
  onReinstall,
  onChangeIp,
  onCheck,
}) {
  const { show } = usePopMenu()
  const buttonRef = useRef(null)
  const t = useTranslation()

  const handleClick = (e) => {
    e.stopPropagation() // Block triggering parent click handler (select table row)
    if (!buttonRef.current) return

    show(buttonRef.current, {
      actions: [
        onUpgrade && {
          label: t('vpsManager.upgrade'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 720 960"
              className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
            >
              <path d="M 117.033 -91.251 L 117.033 -188.44 L 602.967 -188.44 L 602.967 -91.251 L 117.033 -91.251 Z M 311.407 -285.63 L 311.407 -682.88 L 185.064 -557.75 L 117.033 -625.78 L 360 -868.75 L 602.967 -625.78 L 534.936 -557.75 L 408.593 -682.88 L 408.593 -285.63 L 311.407 -285.63 Z" />
            </svg>
          ),
          className: 'text-green',
          onAction: onUpgrade,
          // No confirm — upgrade is a safe, non-destructive action
        },
        {
          label: t('manager.pause'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
            >
              <path d="M176 96C149.5 96 128 117.5 128 144L128 496C128 522.5 149.5 544 176 544L240 544C266.5 544 288 522.5 288 496L288 144C288 117.5 266.5 96 240 96L176 96zM400 96C373.5 96 352 117.5 352 144L352 496C352 522.5 373.5 544 400 544L464 544C490.5 544 512 522.5 512 496L512 144C512 117.5 490.5 96 464 96L400 96z" />
            </svg>
          ),
          className: 'text-red',
          confirm: {
            title: (
              <p className="font-medium">
                {t('popConfirm.youWantTo')}{' '}
                <span className="text-primary font-bold">{t('manager.pause')}</span>?
              </p>
            ),
          },
          onAction: onPause,
        },
        {
          label: t('manager.reboot'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              className="mr-1 h-4.5 w-4.5 shrink-0 fill-current sm:mr-2 sm:size-6"
            >
              <path d="m 8 0 c -0.550781 0 -1 0.449219 -1 1 v 5 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -5 c 0 -0.550781 -0.449219 -1 -1 -1 z m -7 1 l 2.050781 2.050781 c -2.117187 2.117188 -2.652343 5.355469 -1.332031 8.039063 c 1.324219 2.683594 4.214844 4.238281 7.179688 3.851562 c 2.96875 -0.386718 5.367187 -2.625 5.960937 -5.554687 c 0.59375 -2.933594 -0.75 -5.929688 -3.335937 -7.433594 c -0.476563 -0.28125 -1.089844 -0.117187 -1.367188 0.359375 s -0.117188 1.089844 0.359375 1.367188 c 1.851563 1.078124 2.808594 3.207031 2.382813 5.3125 c -0.421876 2.101562 -2.128907 3.691406 -4.253907 3.96875 c -2.128906 0.273437 -4.183593 -0.828126 -5.128906 -2.753907 s -0.566406 -4.226562 0.949219 -5.742187 l 1.535156 1.535156 v -4.003906 c 0 -0.519532 -0.449219 -0.996094 -1 -0.996094 z m 0 0" />
            </svg>
          ),
          className: 'text-orange',
          confirm: {
            title: (
              <p className="font-medium">
                {t('popConfirm.youWantTo')}{' '}
                <span className="text-primary font-bold">{t('manager.reboot')}</span>?
              </p>
            ),
          },
          onAction: onReboot,
        },
        onReset && {
          label: t('manager.reset'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
            >
              <path d="M544.1 256L552 256C565.3 256 576 245.3 576 232L576 88C576 78.3 570.2 69.5 561.2 65.8C552.2 62.1 541.9 64.2 535 71L483.3 122.8C439 86.1 382 64 320 64C191 64 84.3 159.4 66.6 283.5C64.1 301 76.2 317.2 93.7 319.7C111.2 322.2 127.4 310 129.9 292.6C143.2 199.5 223.3 128 320 128C364.4 128 405.2 143 437.7 168.3L391 215C384.1 221.9 382.1 232.2 385.8 241.2C389.5 250.2 398.3 256 408 256L544.1 256zM573.5 356.5C576 339 563.8 322.8 546.4 320.3C529 317.8 512.7 330 510.2 347.4C496.9 440.4 416.8 511.9 320.1 511.9C275.7 511.9 234.9 496.9 202.4 471.6L249 425C255.9 418.1 257.9 407.8 254.2 398.8C250.5 389.8 241.7 384 232 384L88 384C74.7 384 64 394.7 64 408L64 552C64 561.7 69.8 570.5 78.8 574.2C87.8 577.9 98.1 575.8 105 569L156.8 517.2C201 553.9 258 576 320 576C449 576 555.7 480.6 573.4 356.5z" />
            </svg>
          ),
          className: 'text-blue',
          confirm: {
            title: (
              <p className="font-medium">
                {t('popConfirm.youWantTo')}{' '}
                <span className="text-primary font-bold">{t('manager.reset')}</span>?
              </p>
            ),
          },
          onAction: onReset,
        },
        onRefund && {
          label: t('manager.refund'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
            >
              <path d="M384 32H64C28.654 32 0 60.652 0 96V416C0 451.346 28.654 480 64 480H384C419.346 480 448 451.346 448 416V96C448 60.652 419.346 32 384 32ZM310.764 314.281C305.451 342.701 281.738 361.422 248.045 366.818V384C248.045 397.25 237.295 408 224.045 408S200.045 397.25 200.045 384V365.939C185.955 363.51 171.59 359 158.795 354.734L152.514 352.656C139.92 348.531 133.045 334.969 137.17 322.375S154.92 302.922 167.451 307.031L173.951 309.187C186.076 313.219 199.795 317.781 210.951 319.344C238.826 323.359 261.326 317.359 263.576 305.437C265.389 295.828 261.732 290.766 217.795 279.156L209.201 276.875C184.482 270.156 126.576 254.469 137.201 197.719C142.523 169.283 166.266 150.521 200.045 145.156V128C200.045 114.75 210.795 104 224.045 104S248.045 114.75 248.045 128V146.002C256.998 147.568 266.891 149.984 279.264 153.937C291.889 157.953 298.889 171.469 294.857 184.094C290.857 196.719 277.326 203.75 264.701 199.656C253.139 195.969 244.014 193.672 236.857 192.641C209.295 188.703 186.607 194.625 184.389 206.562C183.045 213.625 181.92 219.734 221.764 230.547L230.045 232.75C264.264 241.781 321.514 256.906 310.764 314.281Z" />
            </svg>
          ),
          confirm: {
            title: (
              <p className="font-medium">
                {t('popConfirm.youWantTo')}{' '}
                <span className="text-primary font-bold">{t('manager.refund')}</span>?
              </p>
            ),
          },
          onAction: onRefund,
        },
        onReinstall && {
          label: t('manager.reinstall'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
            >
              <path d="M544.1 256L552 256C565.3 256 576 245.3 576 232L576 88C576 78.3 570.2 69.5 561.2 65.8C552.2 62.1 541.9 64.2 535 71L483.3 122.8C439 86.1 382 64 320 64C191 64 84.3 159.4 66.6 283.5C64.1 301 76.2 317.2 93.7 319.7C111.2 322.2 127.4 310 129.9 292.6C143.2 199.5 223.3 128 320 128C364.4 128 405.2 143 437.7 168.3L391 215C384.1 221.9 382.1 232.2 385.8 241.2C389.5 250.2 398.3 256 408 256L544.1 256zM573.5 356.5C576 339 563.8 322.8 546.4 320.3C529 317.8 512.7 330 510.2 347.4C496.9 440.4 416.8 511.9 320.1 511.9C275.7 511.9 234.9 496.9 202.4 471.6L249 425C255.9 418.1 257.9 407.8 254.2 398.8C250.5 389.8 241.7 384 232 384L88 384C74.7 384 64 394.7 64 408L64 552C64 561.7 69.8 570.5 78.8 574.2C87.8 577.9 98.1 575.8 105 569L156.8 517.2C201 553.9 258 576 320 576C449 576 555.7 480.6 573.4 356.5z" />
            </svg>
          ),
          onAction: onReinstall,
        },
        onChangeIp && {
          label: t('manager.changeIp'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
            >
              <path d="M566.6 214.6L470.6 310.6C461.4 319.8 447.7 322.5 435.7 317.5C423.7 312.5 416 300.9 416 288L416 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L416 160L416 96C416 83.1 423.8 71.4 435.8 66.4C447.8 61.4 461.5 64.2 470.7 73.3L566.7 169.3C579.2 181.8 579.2 202.1 566.7 214.6zM169.3 566.6L73.3 470.6C60.8 458.1 60.8 437.8 73.3 425.3L169.3 329.3C178.5 320.1 192.2 317.4 204.2 322.4C216.2 327.4 224 339.1 224 352L224 416L544 416C561.7 416 576 430.3 576 448C576 465.7 561.7 480 544 480L224 480L224 544C224 556.9 216.2 568.6 204.2 573.6C192.2 578.6 178.5 575.8 169.3 566.7z" />
            </svg>
          ),
          onAction: onChangeIp,
        },
        onCheck && {
          label: t('check'),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="mr-1 h-4.5 w-4.5 shrink-0 fill-current sm:mr-2 sm:size-6"
            >
              <path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" />
            </svg>
          ),
          onAction: onCheck,
        },
      ],
      direction: [1, 0],
    })
  }

  return (
    <div ref={buttonRef} className="inline-flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640"
        className="mx-auto size-7 cursor-pointer fill-current"
        onClick={handleClick}
      >
        <path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z" />
      </svg>
    </div>
  )
}
