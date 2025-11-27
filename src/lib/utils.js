export const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.onloadedmetadata = () => resolve(audio.duration)
    audio.src = URL.createObjectURL(file)
  })
}

export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const downloadFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}