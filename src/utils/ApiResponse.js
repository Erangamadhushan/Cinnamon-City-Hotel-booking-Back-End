export class ApiResponse {
  constructor(success, message = null, data = null) {
    this.success = success;
    if (data !== null) {
      this.data = data;
    }

    if (message !== null) {
      this.message = message;
    }
  }
}
